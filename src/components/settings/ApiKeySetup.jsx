import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Key, ExternalLink, Shield, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { saveProviderKey } from '@/components/epi/workflowEngine';

export default function ApiKeySetup({ open, onOpenChange, onSave }) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await saveProviderKey('grok', apiKey.trim());
      onSave?.(apiKey.trim());
      setApiKey('');
      onOpenChange(false);
    } catch {
      setError('Failed to save API key');
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Key className="h-5 w-5 text-violet-400" />
            Grok API Key
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter your xAI Grok API key to enable AI features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xai-..."
              className="bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-600 h-11 font-mono"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-emerald-400 mt-0.5" />
              <p className="text-xs text-zinc-400">
                Your API key is encrypted with AES-256-GCM and stored server-side. It never leaves our backend — all AI calls are proxied securely.
              </p>
            </div>
            <a
              href="https://console.x.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Get your API key from xAI Console
            </a>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!apiKey.trim() || isSaving}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white">
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save Key'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}