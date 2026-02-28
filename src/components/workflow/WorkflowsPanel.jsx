import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitBranch, Plus, Play, Pencil, Trash2, Loader2, 
  CheckCircle2, XCircle, Clock, Zap 
} from 'lucide-react';
import { toast } from 'sonner';
import { runWorkflow } from '@/components/epi/workflowEngine';
import WorkflowBuilder from './WorkflowBuilder';
import WorkflowRunner from './WorkflowRunner';

const TRIGGER_LABELS = {
  manual:               'Manual',
  on_synthesis:         'After Synthesis',
  on_reference_added:   'On Reference Added',
};

const STATUS_BADGE = {
  success: 'bg-emerald-600',
  failed:  'bg-red-700',
  partial: 'bg-amber-600',
};

export default function WorkflowsPanel({ vault, moltbookAgents = [] }) {
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [runningId, setRunningId] = useState(null);
  const [expandedRun, setExpandedRun] = useState(null); // { id, results, finalOutput, status }

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows', vault?.id],
    queryFn: () => base44.entities.Workflow.filter({ vault_id: vault?.id }),
    enabled: !!vault?.id,
  });

  const handleDelete = async (wf) => {
    try {
      await base44.entities.Workflow.delete(wf.id);
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRun = async (wf) => {
    setRunningId(wf.id);
    setExpandedRun(null);

    const ctx = {
      vaultName:    vault?.name || '',
      vaultSummary: vault?.living_summary || '',
      userInput:    '',
      contextPack:  vault?.living_summary || '',
    };

    let liveResults = [];
    const { status, results, finalOutput } = await runWorkflow(
      wf, ctx, moltbookAgents,
      (r) => { liveResults = r; setExpandedRun({ id: wf.id, results: r, finalOutput: '', status: null }); }
    );

    setExpandedRun({ id: wf.id, results, finalOutput, status });
    setRunningId(null);

    // persist last run status
    await base44.entities.Workflow.update(wf.id, {
      last_run: new Date().toISOString(),
      last_run_status: status,
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['workflows'] });

    if (status === 'success') toast.success(`"${wf.name}" completed`);
    else if (status === 'partial') toast.warning(`"${wf.name}" had errors`);
    else toast.error(`"${wf.name}" failed`);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      {/* header */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Workflows</h2>
          <Badge variant="outline" className="border-violet-500/30 text-violet-400">{workflows.length}</Badge>
        </div>
        <Button onClick={() => { setEditingWorkflow(null); setShowBuilder(true); }}
          size="sm" className="bg-violet-600 hover:bg-violet-500">
          <Plus className="h-4 w-4 mr-1.5" />
          New Workflow
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-7 w-7 text-violet-400 animate-spin" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <GitBranch className="h-16 w-16 text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Workflows Yet</h3>
            <p className="text-sm text-zinc-400 mb-5 max-w-sm">
              Chain Epi, external LLMs, and Moltbook agents into automated sequences.
            </p>
            <Button onClick={() => setShowBuilder(true)} className="bg-violet-600 hover:bg-violet-500">
              <Plus className="h-4 w-4 mr-2" />
              Create First Workflow
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {workflows.map((wf) => (
              <div key={wf.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <GitBranch className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{wf.name}</h3>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">
                        <Zap className="h-2.5 w-2.5 mr-1" />
                        {TRIGGER_LABELS[wf.trigger_type] || 'Manual'}
                      </Badge>
                      {wf.last_run_status && (
                        <Badge className={`text-[10px] text-white ${STATUS_BADGE[wf.last_run_status] || 'bg-zinc-700'}`}>
                          {wf.last_run_status}
                        </Badge>
                      )}
                    </div>
                    {wf.description && <p className="text-xs text-zinc-400 mb-2">{wf.description}</p>}
                    <p className="text-xs text-zinc-600">{wf.steps?.length || 0} steps</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingWorkflow(wf); setShowBuilder(true); }}
                      className="h-8 w-8 p-0 text-zinc-500 hover:text-white">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(wf)}
                      className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" onClick={() => handleRun(wf)} disabled={!!runningId}
                      className="h-8 bg-emerald-700 hover:bg-emerald-600 px-3">
                      {runningId === wf.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Play className="h-3.5 w-3.5 mr-1" />}
                      {runningId === wf.id ? 'Running…' : 'Run'}
                    </Button>
                  </div>
                </div>

                {/* Live results panel */}
                {expandedRun?.id === wf.id && (
                  <div className="border-t border-zinc-800 p-4">
                    <WorkflowRunner
                      stepResults={expandedRun.results}
                      finalOutput={expandedRun.finalOutput}
                      overallStatus={expandedRun.status}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <WorkflowBuilder
        open={showBuilder}
        onOpenChange={setShowBuilder}
        vault={vault}
        moltbookAgents={moltbookAgents}
        existingWorkflow={editingWorkflow}
        onSave={() => queryClient.invalidateQueries({ queryKey: ['workflows'] })}
      />
    </div>
  );
}