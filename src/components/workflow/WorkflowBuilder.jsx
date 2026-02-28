import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Play, Save, Loader2, GitBranch } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import WorkflowStepEditor from './WorkflowStepEditor';
import WorkflowRunner from './WorkflowRunner';
import { runWorkflow } from '@/components/epi/workflowEngine';

const TRIGGERS = [
  { value: 'manual',               label: 'Manual (run on demand)' },
  { value: 'on_synthesis',         label: 'After session synthesis' },
  { value: 'on_reference_added',   label: 'When a reference is added' },
];

const uid = () => Math.random().toString(36).slice(2, 10);

export default function WorkflowBuilder({ open, onOpenChange, vault, moltbookAgents = [], onSave, existingWorkflow }) {
  const isEditing = !!existingWorkflow;

  const [name, setName]           = useState(existingWorkflow?.name || '');
  const [description, setDesc]    = useState(existingWorkflow?.description || '');
  const [trigger, setTrigger]     = useState(existingWorkflow?.trigger_type || 'manual');
  const [steps, setSteps]         = useState(existingWorkflow?.steps || []);
  const [userInput, setUserInput] = useState('');
  const [isSaving, setIsSaving]   = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [stepResults, setStepResults] = useState([]);
  const [runStatus, setRunStatus]     = useState(null);
  const [finalOutput, setFinalOutput] = useState('');

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        step_id:    uid(),
        name:       `Step ${prev.length + 1}`,
        agent_type: 'llm',
        provider:   'base44',
        prompt:     '',
        condition:  '',
        on_error:   'stop',
      },
    ]);
  };

  const updateStep = (idx, updated) => setSteps((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  const removeStep = (idx) => setSteps((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim())   { toast.error('Give this workflow a name'); return; }
    if (!steps.length)  { toast.error('Add at least one step'); return; }
    setIsSaving(true);
    try {
      const data = { name, description, trigger_type: trigger, steps, vault_id: vault.id, status: 'active' };
      let saved;
      if (isEditing) {
        saved = await base44.entities.Workflow.update(existingWorkflow.id, data);
      } else {
        saved = await base44.entities.Workflow.create(data);
      }
      toast.success(`Workflow "${name}" saved`);
      onSave?.(saved);
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to save workflow');
    }
    setIsSaving(false);
  };

  const handleRun = async () => {
    if (!steps.length) { toast.error('Add steps first'); return; }
    setIsRunning(true);
    setStepResults([]);
    setRunStatus(null);
    setFinalOutput('');

    const workflow = { steps };
    const ctx = {
      vaultName:    vault?.name || '',
      vaultSummary: vault?.living_summary || '',
      userInput,
      contextPack:  vault?.living_summary || '',
    };

    const { status, results, finalOutput: out } = await runWorkflow(
      workflow,
      ctx,
      moltbookAgents,
      setStepResults
    );

    setRunStatus(status);
    setFinalOutput(out || '');
    setIsRunning(false);

    if (status === 'success') toast.success('Workflow completed');
    else if (status === 'partial') toast.warning('Workflow completed with errors');
    else toast.error('Workflow failed');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl bg-zinc-950 border-zinc-800 p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-zinc-800">
          <SheetTitle className="flex items-center gap-2 text-white">
            <GitBranch className="h-5 w-5 text-violet-400" />
            {isEditing ? 'Edit Workflow' : 'New Workflow'}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-5">
            {/* meta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Research + Summarise" className="bg-zinc-800 border-zinc-700 text-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">Trigger</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger className="h-9 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {TRIGGERS.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-zinc-200 text-sm">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDesc(e.target.value)}
                placeholder="What does this workflow do?" rows={2}
                className="bg-zinc-800 border-zinc-700 text-white text-sm resize-none" />
            </div>

            {/* steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white">Steps</p>
                <Button onClick={addStep} size="sm" variant="outline"
                  className="h-7 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Step
                </Button>
              </div>
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <WorkflowStepEditor
                    key={step.step_id || i}
                    step={step}
                    index={i}
                    moltbookAgents={moltbookAgents}
                    onChange={(updated) => updateStep(i, updated)}
                    onRemove={() => removeStep(i)}
                  />
                ))}
                {steps.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-zinc-700 rounded-xl">
                    <p className="text-sm text-zinc-500">No steps yet — add one above</p>
                  </div>
                )}
              </div>
            </div>

            {/* test run */}
            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <p className="text-sm font-medium text-white">Test Run</p>
              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs">User input (populates {'{{user_input}}'})</Label>
                <Textarea value={userInput} onChange={(e) => setUserInput(e.target.value)}
                  placeholder="What would the user say to trigger this?" rows={2}
                  className="bg-zinc-800 border-zinc-700 text-white text-sm resize-none" />
              </div>
              <Button onClick={handleRun} disabled={isRunning || !steps.length}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white">
                {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                {isRunning ? 'Running…' : 'Run Workflow'}
              </Button>
              <WorkflowRunner stepResults={stepResults} finalOutput={finalOutput} overallStatus={runStatus} />
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-zinc-800 flex gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}
            className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditing ? 'Update' : 'Save Workflow'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}