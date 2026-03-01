import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Save, FolderOpen, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { PERSONALITY_AGENTS } from './personalityAgents';

const STORAGE_KEY = 'epi_agent_configs';

const BUILT_IN_PRESETS = [
  {
    id: 'debate_team',
    name: 'Debate Team',
    icon: '⚔️',
    agents: ['devils_advocate', 'researcher', 'critic'],
    rounds: 2,
    builtIn: true,
  },
  {
    id: 'research_group',
    name: 'Research Group',
    icon: '🔬',
    agents: ['researcher', 'synthesizer', 'critic'],
    rounds: 2,
    builtIn: true,
  },
  {
    id: 'strategy_council',
    name: 'Strategy Council',
    icon: '♟️',
    agents: ['strategist', 'researcher', 'devils_advocate', 'synthesizer'],
    rounds: 2,
    builtIn: true,
  },
  {
    id: 'full_council',
    name: 'Full Council',
    icon: '🌐',
    agents: ['researcher', 'devils_advocate', 'synthesizer', 'strategist', 'critic'],
    rounds: 1,
    builtIn: true,
  },
];

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveToDisk(configs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export default function AgentConfigPresets({ activeAgents, rounds, onLoad }) {
  const [savedConfigs, setSavedConfigs] = useState(loadSaved);
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const allPresets = [...BUILT_IN_PRESETS, ...savedConfigs];

  const handleSave = () => {
    if (!saveName.trim()) { toast.error('Enter a name'); return; }
    const newConfig = {
      id: `custom_${Date.now()}`,
      name: saveName.trim(),
      icon: '⚙️',
      agents: activeAgents,
      rounds,
      builtIn: false,
    };
    const updated = [...savedConfigs, newConfig];
    setSavedConfigs(updated);
    saveToDisk(updated);
    setSaveName('');
    setShowSaveForm(false);
    toast.success(`Saved "${newConfig.name}"`);
  };

  const handleDelete = (id) => {
    const updated = savedConfigs.filter(c => c.id !== id);
    setSavedConfigs(updated);
    saveToDisk(updated);
    toast.success('Config deleted');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
          <FolderOpen className="h-3.5 w-3.5" /> Presets
        </label>
        <button
          onClick={() => setShowSaveForm(v => !v)}
          className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
        >
          <Save className="h-3 w-3" /> Save current
        </button>
      </div>

      {showSaveForm && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Config name…"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-500"
          />
          <Button size="sm" onClick={handleSave} className="h-7 bg-violet-600 hover:bg-violet-500 text-xs px-3">
            <Check className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {allPresets.map(preset => {
          const agentData = preset.agents.map(id => PERSONALITY_AGENTS.find(a => a.id === id)).filter(Boolean);
          return (
            <div key={preset.id} className="flex items-center gap-1 group">
              <button
                onClick={() => { onLoad(preset.agents, preset.rounds); toast.success(`Loaded "${preset.name}"`); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-violet-500/50 hover:bg-zinc-700 transition-all text-xs text-zinc-300"
                title={agentData.map(a => a.name).join(', ')}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500">{preset.agents.length} agents</span>
              </button>
              {!preset.builtIn && (
                <button
                  onClick={() => handleDelete(preset.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-0.5"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}