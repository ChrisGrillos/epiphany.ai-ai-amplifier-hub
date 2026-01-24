import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { User, Sparkles, Copy, Check, Image as ImageIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function MessageBubble({ message, isStreaming }) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const target = message.target || 'api';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSystem) return null;

  return (
    <div className={cn(
      "group flex gap-4 px-6 py-5",
      isUser ? "bg-transparent" : "bg-zinc-900/30"
    )}>
      {/* Avatar */}
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
        isUser 
          ? "bg-zinc-700/50" 
          : "bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-zinc-400" />
        ) : target === 'epi' ? (
          <Sparkles className="h-4 w-4 text-violet-400" />
        ) : (
          <Zap className="h-4 w-4 text-emerald-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-medium uppercase tracking-wider",
            isUser ? "text-zinc-500" : "text-violet-400/80"
          )}>
            {isUser ? 'You' : target === 'epi' ? 'Epi' : 'Assistant'}
          </span>
          {!isUser && (
            <Badge 
              variant="outline" 
              className={cn(
                "h-5 text-[10px] font-normal",
                target === 'epi' 
                  ? "border-violet-500/30 text-violet-400"
                  : "border-emerald-500/30 text-emerald-400"
              )}
            >
              {target === 'epi' ? 'Epi' : 'API'}
            </Badge>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[10px] text-violet-400/60">thinking</span>
            </span>
          )}
        </div>

        {/* Images */}
        {message.image_urls?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.image_urls.map((url, idx) => (
              <div key={idx} className="relative group/img">
                <img
                  src={url}
                  alt="Attached"
                  className="h-32 w-auto rounded-lg border border-zinc-700/50 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-white/70" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        <div className={cn(
          "prose prose-invert prose-sm max-w-none",
          "prose-p:text-zinc-300 prose-p:leading-relaxed",
          "prose-headings:text-white prose-headings:font-medium",
          "prose-strong:text-white prose-strong:font-medium",
          "prose-code:text-violet-300 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800",
          "prose-li:text-zinc-300 prose-li:marker:text-zinc-600",
          "prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline"
        )}>
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-violet-400/50 animate-pulse ml-0.5" />
          )}
        </div>

        {/* Actions */}
        {!isUser && !isStreaming && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-zinc-500 hover:text-white hover:bg-zinc-800"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}