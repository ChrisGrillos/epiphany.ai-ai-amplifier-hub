import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ALLOWED_TYPES = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'application/json': 'json'
};

const ALLOWED_EXTENSIONS = ['txt', 'md', 'csv', 'json'];

export default function AddReferenceModal({ open, onOpenChange, vaultId, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File too large. Maximum 10MB.';
    }
    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: selectedFile
      });

      // Read content
      const content = await readFileContent(selectedFile);
      const excerpt = content.substring(0, 500);

      // Get file type
      const ext = selectedFile.name.split('.').pop().toLowerCase();

      // Create reference record
      await base44.entities.Reference.create({
        vault_id: vaultId,
        filename: selectedFile.name,
        file_url,
        file_type: ext,
        size: selectedFile.size,
        excerpt,
        full_content: content.length < 20000 ? content : null
      });

      toast.success('Reference added');
      onSuccess();
      onOpenChange(false);
      setSelectedFile(null);
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    }

    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-blue-400" />
            Add Reference
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* File Picker */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              Select File
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 border-dashed border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50"
            >
              {selectedFile ? (
                <div className="flex items-center gap-3">
                  <FileCheck className="h-6 w-6 text-blue-400" />
                  <div className="text-left">
                    <p className="text-sm text-white">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Click to select file</span>
                  <span className="text-xs text-zinc-600">.txt, .md, .csv, .json</span>
                </div>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
            <p className="text-xs text-zinc-400">
              Files are uploaded securely and can be attached to sessions. 
              The AI can read and propose modifications with your approval.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                setSelectedFile(null);
                setError('');
              }}
              disabled={uploading}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Reference
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}