import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Check, ExternalLink, ChevronRight, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { saveProviderKey, fetchKeyStatus, setActiveProvider, PROVIDERS } from '@/components/epi/workflowEngine';

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
        <p className="text-xs text-zinc-500">{keyed ? 'Key configured (server-side)' : 'No key set'}</p>
      </div>
      {active && <Badge className="bg-violet-600 text-white text-[10px]">Active</Badge>}
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(provider); }}
        className="h-7 px-2 text-zinc-500 hover:text-white">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function EditProviderForm({ provider, onSaved, onBack }) {
  const meta = PROVIDER_META[provider];
  const [key, setKey] = useState('');
  const [url, setUrl] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!key.trim()) { toast.error('Enter an API key'); return; }
    if (provider === 'custom' && !url.trim()) { toast.error('URL is required'); return; }
    setSaving(true);
    try {
      await saveProviderKey(provider, key.trim(), provider === 'custom' ? { url: url.trim(), model: model.trim() } : {});
      toast.success(`${meta.label} key saved securely`);
      onSaved();
      onBack();
    } catch {
      toast.error('Failed to save key');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">← Back</button>
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
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
              className="bg-zinc-800/50 border-zinc-700 text-white h-10" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Model name</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o"
              className="bg-zinc-800/50 border-zinc-700 text-white h-10" />
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

      <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
        <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400">
          Your key is encrypted server-side with AES-256-GCM and tied to your account. It never leaves our backend after being saved.
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-500">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save Key Securely'}
      </Button>
    </div>
  );
}

export default function MultiApiKeySetup({ open, onOpenChange, onProviderChange }) {
  const [editing, setEditing] = useState(null);
  const [activeProvider, setActive] = useState('base44');
  const [hasKey, setHasKey] = useState({});
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const status = await fetchKeyStatus();
      setHasKey(status.hasKey || {});
      setActive(status.activeProvider || 'base44');
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadStatus();
  }, [open]);

  const handleSelectActive = async (provider) => {
    setActive(provider);
    try {
      await setActiveProvider(provider);
      onProviderChange?.(provider);
    } catch { /* ignore */ }
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
            </div>
          ) : editing ? (
            <EditProviderForm
              provider={editing}
              onSaved={loadStatus}
              onBack={() => setEditing(null)}
            />
          ) : (
            <>
              <p className="text-xs text-zinc-500">Click a provider to set it active. Use the arrow to configure its key.</p>

              {/* Base44 built-in */}
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
                  keyed={p === 'custom' ? !!hasKey.custom : !!hasKey[p]}
                  active={activeProvider === p}
                  onSelect={handleSelectActive}
                  onEdit={setEditing}
                />
              ))}

              <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mt-2">
                <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400">
                  Keys are encrypted with AES-256-GCM at rest, stored server-side, and never returned to the browser. All AI calls are proxied through our backend.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}