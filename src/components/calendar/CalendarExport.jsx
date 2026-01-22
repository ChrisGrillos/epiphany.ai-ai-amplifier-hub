import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Copy, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function CalendarExport({ 
  open, 
  onOpenChange,
  livingSummary,
  apiKey 
}) {
  const [calendarText, setCalendarText] = useState('');
  const [icsData, setIcsData] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const extractNextActions = (summary) => {
    const lines = summary?.split('\n') || [];
    const actionsIndex = lines.findIndex(l => l.includes('## Next Actions'));
    if (actionsIndex === -1) return [];
    
    const actions = [];
    for (let i = actionsIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('##')) break;
      if (line.startsWith('-') || line.startsWith('*')) {
        actions.push(line.replace(/^[-*]\s*/, ''));
      }
    }
    return actions;
  };

  const generateCalendarText = async () => {
    if (!apiKey) {
      toast.error('API key required');
      return;
    }

    const actions = extractNextActions(livingSummary);
    if (actions.length === 0) {
      toast.error('No Next Actions found');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Convert these action items into calendar event descriptions. For each action, provide:
- A clear title
- Suggested date/time (if inferable, otherwise suggest "TBD")
- Brief description

Actions:
${actions.join('\n')}

Format as human-readable text, not ICS format.`;

      const text = await base44.integrations.Core.InvokeLLM({ prompt });
      setCalendarText(text);
    } catch (error) {
      toast.error('Failed to generate calendar text');
    }
    setIsGenerating(false);
  };

  const generateICS = () => {
    const actions = extractNextActions(livingSummary);
    if (actions.length === 0) {
      toast.error('No Next Actions found');
      return;
    }

    const now = new Date();
    const icsEvents = actions.map((action, idx) => {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + idx + 1);
      const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      return `BEGIN:VEVENT
UID:epiphany-${Date.now()}-${idx}@epiphany.ai
DTSTAMP:${dateStr}
DTSTART:${dateStr}
SUMMARY:${action}
DESCRIPTION:From Epiphany.AI Living Summary
STATUS:TENTATIVE
END:VEVENT`;
    }).join('\n');

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Epiphany.AI//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${icsEvents}
END:VCALENDAR`;

    setIcsData(ics);
    
    // Download
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'epiphany-next-actions.ics';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Calendar file downloaded');
  };

  const copyText = () => {
    navigator.clipboard.writeText(calendarText);
    toast.success('Calendar text copied');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-blue-400" />
            Export to Calendar
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text" className="mt-4">
          <TabsList className="bg-zinc-800/50">
            <TabsTrigger value="text" className="text-xs">
              Calendar Text
            </TabsTrigger>
            <TabsTrigger value="ics" className="text-xs">
              .ICS File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={generateCalendarText}
                disabled={isGenerating || !apiKey}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Generate Calendar Entry Text
                  </>
                )}
              </Button>

              {calendarText && (
                <>
                  <Textarea
                    value={calendarText}
                    readOnly
                    className="h-64 bg-zinc-800/50 border-zinc-700 text-white font-mono text-sm resize-none"
                  />
                  <Button
                    variant="outline"
                    onClick={copyText}
                    className="w-full border-zinc-700"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ics" className="space-y-4">
            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Export your Next Actions as an .ics calendar file. Each action will be created 
                as a tentative event on sequential days. You can then import this file into 
                Google Calendar, Outlook, or Apple Calendar.
              </p>
            </div>

            <Button
              onClick={generateICS}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download .ICS File
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}