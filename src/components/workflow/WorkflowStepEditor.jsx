import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, GripVertical } from 'lucide-react';

const AGENT_TYPES = [
  { value: 'llm',      label: 'External LLM' },
  { value: 'epi',      label: 'Epi (context orchestrator)' },
  { value: 'moltbook', label: 'Moltbook Agent' },
];

const PROVIDERS = [
  { value: 'base44',    label: 'Base44 Built-in' },
  { value: 'grok',      label: 'Grok (xAI)' },
  { value: 'openai',    label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'custom',    label: 'Custom (OpenAI-compat)' },
];

const ON_ERROR = [
  { value: 'stop',  label: 'Stop workflow' },
  { value: 'skip',  label: 'Skip step' },
  { value: 'retry', label: 'Retry once' },
];

export default function WorkflowStepEditor({ step, index, moltbookAgents = [], onChange, onRemove }) {
  const set = (key, val) => onChange({ ...step, [key]: val });

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 space-y-3">
      {/* header */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-zinc-600 cursor-grab" />
        <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">Step {index + 1}</span>
        <Input
          value={step.name || ''}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Step name…"
          className="h-7 text-sm bg-zinc-900 border-zinc-700 text-white flex-1"
        />
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* agent type + provider */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-zinc-500">Agent type</Label>
          <Select value={step.agent_type || 'llm'} onValueChange={(v) => set('agent_type', v)}>
            <SelectTrigger className="h-8 bg-zinc-900 border-zinc-700 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {AGENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-zinc-200 text-xs">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {step.agent_type === 'moltbook' ? (
          <div className="space-y-1">
            <Label className="text-[11px] text-zinc-500">Moltbook agent</Label>
            <Select value={step.agent_id || ''} onValueChange={(v) => set('agent_id', v)}>
              <SelectTrigger className="h-8 bg-zinc-900 border-zinc-700 text-white text-xs">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {moltbookAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-zinc-200 text-xs">{a.agent_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : step.agent_type !== 'epi' ? (
          <div className="space-y-1">
            <Label className="text-[11px] text-zinc-500">Provider</Label>
            <Select value={step.provider || 'base44'} onValueChange={(v) => set('provider', v)}>
              <SelectTrigger className="h-8 bg-zinc-900 border-zinc-700 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="text-zinc-200 text-xs">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* prompt */}
      <div className="space-y-1">
        <Label className="text-[11px] text-zinc-500">
          Prompt template &nbsp;
          <span className="text-zinc-600 font-mono">{'{{vault_summary}} {{previous_output}} {{user_input}}'}</span>
        </Label>
        <Textarea
          value={step.prompt || ''}
          onChange={(e) => set('prompt', e.target.value)}
          placeholder="You are a helpful assistant. Using the context below, answer the user's question.\n\nContext: {{vault_summary}}\n\nUser: {{user_input}}"
          className="bg-zinc-900 border-zinc-700 text-white text-xs resize-none min-h-[80px]"
          rows={3}
        />
      </div>

      {/* condition + on_error */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-zinc-500">Condition (JS, optional)</Label>
          <Input
            value={step.condition || ''}
            onChange={(e) => set('condition', e.target.value)}
            placeholder={`previousOutput.includes('error')`}
            className="h-8 bg-zinc-900 border-zinc-700 text-white text-xs font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-zinc-500">On error</Label>
          <Select value={step.on_error || 'stop'} onValueChange={(v) => set('on_error', v)}>
            <SelectTrigger className="h-8 bg-zinc-900 border-zinc-700 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {ON_ERROR.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-zinc-200 text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}