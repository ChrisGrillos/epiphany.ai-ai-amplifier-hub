import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Check, ExternalLink, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { saveProviderKey, getApiKeys, PROVIDERS, setActiveProvider, getActiveProvider } from '@/components/epi/workflowEngine';

const PROVIDER_META = {
  grok:      { label: 'Grok (xAI)',   placeholder: 'xai-...', link: 'https://console.x.ai/', linkLabel: 'xAI Console' },
  openai:    { label: 'OpenAI',       placeholder: 'sk-...',  link: 'https://platform.openai.com/api-keys', linkLabel: 'OpenAI Console' },
  anthropic: { label: 'Anthropic',    placeholder: 'sk-ant-...', link: 'https://console.anthropic.com/', linkLabel: 'Anthropic Console' },
  custom:    { label: 'Custom (OpenAI-compatible)', placeholder: 'API key', link: null, linkLabel: null },
};

function ProviderRow({ provider, keyed, active, onSelect, onEdit }) {
  const meta = PROVIDER_META[provider];
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        active ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-700'
      }`}
      onClick={() => onSelect(provider)}
    >
      <div className={`h-2 w-2 rounded-full ${keyed ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium">{meta.label}</p>
        <p className="text-xs text-zinc-500">{keyed ? 'Key configured' : 'No key set'}</p>
      </div>
      {active && <Badge className="bg-violet-600 text-white text-[10px]">Active</Badge>}
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(provider); }}
        className="h-7 px-2 text-zinc-500 hover:text-white">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function EditProviderForm({ provider, onSave, onBack }) {
  const meta = PROVIDER_META[provider];
  const keys = getApiKeys();
  const [key, setKey] = useState('');
  const [url, setUrl] = useState(keys.custom_url || '');
  const [model, setModel] = useState(keys.custom_model || 'gpt-4o');

  const handleSave = () => {
    if (!key.trim() && provider !== 'custom') { toast.error('Enter an API key'); return; }
    if (provider === 'custom' && (!key.trim() || !url.trim())) { toast.error('Key and URL are required'); return; }
    saveProviderKey(provider, key.trim(), { url: url.trim(), model: model.trim() });
    toast.success(`${meta.label} key saved`);
    onBack();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">
        ← Back
      </button>
      <h3 className="text-sm font-medium text-white">{meta.label}</h3>

      <div className="space-y-2">
        <Label className="text-zinc-400 text-xs">API Key</Label>
        <Input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={meta.placeholder}
          className="bg-zinc-800/50 border-zinc-700 text-white font-mono h-10"
        />
      </div>

      {provider === 'custom' && (
        <>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Base URL (e.g. https://my-endpoint.com/v1)</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="bg-zinc-800/50 border-zinc-700 text-white h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Model name</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o"
              className="bg-zinc-800/50 border-zinc-700 text-white h-10"
            />
          </div>
        </>
      )}

      {meta.link && (
        <a href={meta.link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
          <ExternalLink className="h-3 w-3" />
          Get key from {meta.linkLabel}
        </a>
      )}

      <Button onClick={handleSave} className="w-full bg-violet-600 hover:bg-violet-500">Save Key</Button>
    </div>
  );
}

export default function MultiApiKeySetup({ open, onOpenChange, onProviderChange }) {
  const [editing, setEditing] = useState(null);
  const [activeProvider, setActive] = useState(getActiveProvider);
  const keys = getApiKeys();

  const handleSelectActive = (provider) => {
    setActive(provider);
    setActiveProvider(provider);
    onProviderChange?.(provider);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Key className="h-5 w-5 text-violet-400" />
            AI Provider Keys
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {editing ? (
            <EditProviderForm provider={editing} onSave={() => {}} onBack={() => setEditing(null)} />
          ) : (
            <>
              <p className="text-xs text-zinc-500">Click a provider to set it active. Use the arrow to configure its key.</p>

              {/* base44 built-in — always available, no key needed */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  activeProvider === 'base44' ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-700'
                }`}
                onClick={() => handleSelectActive('base44')}
              >
                <div className="h-2 w-2 rounded-full bg-violet-400" />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Base44 Built-in</p>
                  <p className="text-xs text-zinc-500">No key needed — uses platform credits</p>
                </div>
                {activeProvider === 'base44' && <Badge className="bg-violet-600 text-white text-[10px]">Active</Badge>}
              </div>

              {Object.keys(PROVIDER_META).map((p) => (
                <ProviderRow
                  key={p}
                  provider={p}
                  keyed={
                    p === 'custom'
                      ? !!keys.custom_key && !!keys.custom_url
                      : !!keys[p]
                  }
                  active={activeProvider === p}
                  onSelect={handleSelectActive}
                  onEdit={setEditing}
                />
              ))}

              <div className="flex items-start gap-2 bg-zinc-800/30 rounded-lg p-3 mt-2">
                <AlertCircle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400">
                  Keys are stored locally in your browser and sent directly to the provider. They are never stored on our servers.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}