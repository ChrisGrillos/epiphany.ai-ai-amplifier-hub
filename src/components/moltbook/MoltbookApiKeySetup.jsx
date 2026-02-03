import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key } from 'lucide-react';

export default function MoltbookApiKeySetup({ open, onOpenChange, onSave, existingKey }) {
  const [apiKey, setApiKey] = useState(existingKey || '');

  const handleSave = () => {
    onSave(apiKey);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-violet-400" />
            Moltbook API Configuration
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Enter your Moltbook API key to enable agent discovery and communication.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="moltbook-key" className="text-zinc-300">API Key</Label>
            <Input
              id="moltbook-key"
              type="password"
              placeholder="Enter your Moltbook API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400">
            <p className="mb-2">Get your Moltbook API key from:</p>
            <a 
              href="https://moltbook.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline"
            >
              moltbook.com/api-keys
            </a>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey} className="bg-violet-600 hover:bg-violet-500">
            Save Key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}