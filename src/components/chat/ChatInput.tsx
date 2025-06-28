import { useState } from "react";
import { Send } from "react-feather";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "./FileUpload";
import { FileAttachment } from "@/types/chat";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<boolean>;
  onSendFile?: (file: FileAttachment) => Promise<boolean>;
}

export function ChatInput({ onSendMessage, onSendFile }: ChatInputProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = newMessage;
    setNewMessage("");
    if (messageToSend.trim()) {
      await onSendMessage(messageToSend);
    }
  };

  const handleFileUploaded = async (file: FileAttachment) => {
    if (onSendFile) {
      await onSendFile(file);
    }
  };

  return (
    <div className="h-20 min-h-[80px] border-t border-gray-200 bg-white p-4">
      <form
        onSubmit={handleSubmit}
        className="flex items-center space-x-3"
      >
        <FileUpload 
          onFileUploaded={handleFileUploaded}
          disabled={false}
        />
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={!newMessage.trim()}
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
} 