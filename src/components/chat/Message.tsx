import { motion } from "framer-motion";
import { MoreVertical, Trash2, Download, FileText, Image as ImageIcon, File } from "react-feather";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageProps } from "@/types/chat";

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon
const getFileIcon = (mimetype: string, isImage: boolean) => {
  if (isImage) return <ImageIcon className="w-4 h-4" />;
  if (mimetype.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
  if (mimetype.includes('word')) return <FileText className="w-4 h-4 text-blue-500" />;
  if (mimetype.includes('excel') || mimetype.includes('sheet')) return <FileText className="w-4 h-4 text-green-500" />;
  return <File className="w-4 h-4" />;
};

export function Message({ message, isOwnMessage, translatedText, isLecturer, onDelete, currentUserId }: MessageProps) {
  // Determine if user can delete this message
  // In group chats: lecturer (group creator) can delete any message, or message sender can delete their own
  // In direct messages: only message sender can delete their own message
  const canDelete = isLecturer || (currentUserId && message.senderId === currentUserId);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(`http://localhost:3000${url}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const renderFileAttachment = () => {
    if (!message.fileAttachment) return null;

    const { fileAttachment } = message;
    const fileUrl = `http://localhost:3000${fileAttachment.url}`;

    if (fileAttachment.isImage) {
      return (
        <div className="mt-2">
          <img
            src={fileUrl}
            alt={fileAttachment.originalName}
            className="max-w-sm max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(fileUrl, '_blank')}
            loading="lazy"
          />
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>{fileAttachment.originalName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(fileAttachment.url, fileAttachment.originalName)}
              className="h-6 px-2 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={`mt-2 p-3 rounded-lg border-2 border-dashed ${
        isOwnMessage ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getFileIcon(fileAttachment.mimetype, fileAttachment.isImage)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fileAttachment.originalName}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(fileAttachment.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload(fileAttachment.url, fileAttachment.originalName)}
            className="flex-shrink-0"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-xs lg:max-w-md space-y-1 relative group`}>
        {!isOwnMessage && (
          <p className="text-xs font-medium text-gray-600 ml-2">
            {message.senderName}
          </p>
        )}
        <div
          className={`relative px-4 py-2 rounded-lg ${
            isOwnMessage
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-800"
          }`}
        >
          {canDelete && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 hover:bg-transparent ${
                      isOwnMessage ? "text-blue-100" : "text-gray-400"
                    } hover:${isOwnMessage ? "text-white" : "text-gray-600"}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onDelete(message.id)}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          {/* Text content */}
          {message.text && (
            <p className={`text-sm whitespace-pre-wrap ${canDelete ? "pr-6" : ""}`}>
              {message.text}
            </p>
          )}

          {/* File attachment */}
          {renderFileAttachment()}

          {/* Translation */}
          {translatedText && translatedText !== message.text && (
            <div
              className={`mt-2 pt-2 border-t ${
                isOwnMessage ? "border-blue-400" : "border-gray-200"
              }`}
            >
              <p
                className={`text-sm italic ${
                  isOwnMessage ? "text-blue-100" : "text-gray-600"
                }`}
              >
                {translatedText}
              </p>
            </div>
          )}

          {/* Timestamp */}
          <p
            className={`text-xs mt-1 ${
              isOwnMessage ? "text-blue-200" : "text-gray-400"
            } text-right`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
} 