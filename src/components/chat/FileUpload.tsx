import { useState, useRef } from 'react';
import { Paperclip, Image, X, Upload } from 'react-feather';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { FileAttachment } from '@/types/chat';

interface FileUploadProps {
  onFileUploaded: (file: FileAttachment) => void;
  disabled?: boolean;
}

export function FileUpload({ onFileUploaded, disabled }: FileUploadProps) {
  const { user } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = await user.getIdToken();
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      onFileUploaded(data.file);
      toast.success('File uploaded successfully');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        disabled={disabled || isUploading}
      />

      <div
        className={`flex items-center space-x-2 ${dragOver ? 'bg-blue-50 rounded-lg p-2' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="text-gray-500 hover:text-gray-700"
          title="Upload file"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </Button>

        {dragOver && (
          <span className="text-sm text-blue-600 font-medium">
            Drop file here to upload
          </span>
        )}
      </div>
    </div>
  );
} 