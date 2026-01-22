import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Copy, 
  FileText, 
  MessageSquare,
  Package 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExportMenu({ 
  vault,
  messages = [],
  references = [],
  disabled 
}) {
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const exportContextPack = () => {
    const pack = `# Epiphany.AI Context Pack
Vault: ${vault?.name}
Exported: ${new Date().toLocaleString()}

## Living Summary
${vault?.living_summary || '(empty)'}

## References
${references.length > 0 ? references.map(r => `- ${r.filename} (.${r.file_type})`).join('\n') : '(none)'}

## Recent Session (last ${Math.min(messages.length, 10)} messages)
${messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')}
`;
    copyToClipboard(pack, 'Context Pack');
  };

  const exportSessionThread = () => {
    const thread = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
    copyToClipboard(thread, 'Session Thread');
  };

  const exportLivingSummary = () => {
    copyToClipboard(vault?.living_summary || '', 'Living Summary');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Upload className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
        <DropdownMenuLabel className="text-xs text-zinc-500">
          Copy to Clipboard
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        <DropdownMenuItem
          onClick={exportContextPack}
          className="cursor-pointer"
        >
          <Package className="h-4 w-4 mr-2 text-violet-400" />
          <div className="flex-1">
            <p className="text-sm text-white">Context Pack</p>
            <p className="text-xs text-zinc-500">Summary + refs + recent messages</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={exportSessionThread}
          disabled={messages.length === 0}
          className="cursor-pointer"
        >
          <MessageSquare className="h-4 w-4 mr-2 text-blue-400" />
          <div className="flex-1">
            <p className="text-sm text-white">Session Thread</p>
            <p className="text-xs text-zinc-500">All messages in this session</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={exportLivingSummary}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2 text-emerald-400" />
          <div className="flex-1">
            <p className="text-sm text-white">Living Summary</p>
            <p className="text-xs text-zinc-500">Current summary only</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}