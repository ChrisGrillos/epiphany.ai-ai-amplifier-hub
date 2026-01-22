import React, { useState, useRef } from 'react';
import { Send, ImagePlus, Paperclip, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ChatInput({ 
  onSend, 
  disabled, 
  placeholder = "Type your message...",
  isLoading 
}) {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSubmit = () => {
    if (!message.trim() && images.length === 0) return;
    if (disabled || isLoading) return;

    onSend({
      content: message.trim(),
      image_urls: images
    });
    setMessage('');
    setImages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setImages(prev => [...prev, ...urls]);
    } catch (error) {
      toast.error('Failed to upload image');
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-zinc-800/50 bg-zinc-950/50 p-4">
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt="Upload preview"
                className="h-16 w-16 rounded-lg object-cover border border-zinc-700"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-zinc-400" />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="h-16 w-16 rounded-lg border border-zinc-700 border-dashed flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Image upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="h-10 w-10 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 shrink-0"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "min-h-[44px] max-h-32 resize-none",
              "bg-zinc-800/50 border-zinc-700/50 rounded-xl",
              "text-white placeholder:text-zinc-500",
              "focus-visible:ring-1 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50",
              "pr-12"
            )}
          />
          <Button
            onClick={handleSubmit}
            disabled={(!message.trim() && images.length === 0) || disabled || isLoading}
            size="icon"
            className={cn(
              "absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg transition-all",
              message.trim() || images.length > 0
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "bg-zinc-700 text-zinc-500"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}