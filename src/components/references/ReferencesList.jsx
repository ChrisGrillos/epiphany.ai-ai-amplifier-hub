import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Download, 
  Trash2,
  FileCode,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';
import moment from 'moment';

const fileIcons = {
  txt: FileText,
  md: FileText,
  csv: FileCode,
  json: FileCode,
};

const fileColors = {
  txt: 'text-blue-400 bg-blue-500/10',
  md: 'text-purple-400 bg-purple-500/10',
  csv: 'text-green-400 bg-green-500/10',
  json: 'text-amber-400 bg-amber-500/10',
};

export default function ReferencesList({ 
  open, 
  onOpenChange, 
  references = [],
  onAddReference,
  onDeleteReference,
  vaultName 
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:max-w-[400px] bg-zinc-900 border-zinc-800 p-0">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-800">
          <SheetTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              References
            </div>
            <Button
              size="sm"
              onClick={onAddReference}
              className="h-8 bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add
            </Button>
          </SheetTitle>
          <p className="text-xs text-zinc-500 mt-1">{vaultName}</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-4 space-y-3">
            {references.length === 0 ? (
              <div className="text-center py-12">
                <File className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 text-sm">No references yet</p>
                <p className="text-zinc-600 text-xs mt-1">
                  Add files to work with them in sessions
                </p>
              </div>
            ) : (
              references.map((ref) => {
                const Icon = fileIcons[ref.file_type] || FileText;
                const colorClass = fileColors[ref.file_type] || 'text-zinc-400 bg-zinc-500/10';
                
                return (
                  <div
                    key={ref.id}
                    className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 hover:border-zinc-600/50 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        colorClass
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {ref.filename}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="h-5 text-[10px] border-zinc-700">
                            .{ref.file_type}
                          </Badge>
                          <span className="text-xs text-zinc-500">
                            {(ref.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        {ref.excerpt && (
                          <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                            {ref.excerpt}
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-600 mt-1">
                          {moment(ref.created_date).fromNow()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-700/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-zinc-400 hover:text-white"
                        onClick={() => window.open(ref.file_url, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => onDeleteReference(ref.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}