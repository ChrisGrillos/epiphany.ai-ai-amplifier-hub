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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Paperclip, FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AttachReferencesSelector({ 
  references = [], 
  selectedIds = [], 
  onToggle,
  disabled 
}) {
  const selectedCount = selectedIds.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || references.length === 0}
          className={cn(
            "h-10 w-10 rounded-xl relative",
            selectedCount > 0 
              ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" 
              : "text-zinc-500 hover:text-white hover:bg-zinc-800"
          )}
        >
          <Paperclip className="h-5 w-5" />
          {selectedCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-white text-[10px]"
            >
              {selectedCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 bg-zinc-900 border-zinc-800">
        <DropdownMenuLabel className="text-xs text-zinc-500 flex items-center justify-between">
          Attach References
          {selectedCount > 0 && (
            <span className="text-blue-400">{selectedCount} selected</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        {references.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <FileText className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No references available</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {references.map((ref) => {
              const isSelected = selectedIds.includes(ref.id);
              return (
                <DropdownMenuItem
                  key={ref.id}
                  onClick={(e) => {
                    e.preventDefault();
                    onToggle(ref.id);
                  }}
                  className="flex items-center gap-3 py-2 cursor-pointer"
                >
                  <Checkbox
                    checked={isSelected}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm truncate",
                      isSelected ? "text-white font-medium" : "text-zinc-300"
                    )}>
                      {ref.filename}
                    </p>
                    <p className="text-xs text-zinc-500">
                      .{ref.file_type} • {(ref.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}