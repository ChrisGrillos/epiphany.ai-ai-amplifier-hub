import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Copy, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function EmailDraft({ 
  open, 
  onOpenChange,
  livingSummary,
  vaultName,
  apiKey 
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDraft = async () => {
    if (!apiKey) {
      toast.error('API key required');
      return;
    }

    if (!context.trim()) {
      toast.error('Please provide context for the email');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate a professional email based on this context and Living Summary.

Context/Purpose: ${context}

Living Summary:
${livingSummary}

Generate:
1. A clear subject line
2. A professional email body

Format as:
SUBJECT: [subject line]

BODY:
[email body]`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      
      // Parse result
      const subjectMatch = result.match(/SUBJECT:\s*(.+)/i);
      const bodyMatch = result.match(/BODY:\s*([\s\S]+)/i);
      
      if (subjectMatch) setSubject(subjectMatch[1].trim());
      if (bodyMatch) setBody(bodyMatch[1].trim());
    } catch (error) {
      toast.error('Failed to generate email');
    }
    setIsGenerating(false);
  };

  const copyEmail = () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullEmail);
    toast.success('Email copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5 text-emerald-400" />
            Draft Email
          </DialogTitle>
          <p className="text-xs text-zinc-500 mt-1">Based on {vaultName}</p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Context Input */}
          {!subject && !body && (
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                What is this email about?
              </Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="E.g., Update stakeholders on project progress, Request feedback on proposal, Schedule a meeting..."
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 resize-none h-24"
              />
              <Button
                onClick={generateDraft}
                disabled={isGenerating || !apiKey || !context.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Draft...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Email Draft
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Email */}
          {(subject || body) && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                  Subject
                </Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                  Body
                </Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="h-64 bg-zinc-800/50 border-zinc-700 text-white resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubject('');
                    setBody('');
                    setContext('');
                  }}
                  className="flex-1 border-zinc-700"
                >
                  Start Over
                </Button>
                <Button
                  onClick={copyEmail}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}