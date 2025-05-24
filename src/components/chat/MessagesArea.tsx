import { useEffect, useRef } from "react";
import { Message as MessageType } from "@/types/chat";
import { Message } from "./Message";

interface MessagesAreaProps {
  messages: MessageType[];
  isLoading: boolean;
  currentUserId?: string;
  isLecturer: boolean;
  translatedMessages: { [key: string]: string };
  onDeleteMessage: (messageId: string) => void;
}

export function MessagesArea({
  messages,
  isLoading,
  currentUserId,
  isLecturer,
  translatedMessages,
  onDeleteMessage,
}: MessagesAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage.senderId === currentUserId;
      const container = containerRef.current;

      if (container) {
        // If it's the user's own message, always scroll to bottom
        if (isOwnMessage) {
          container.scrollTop = container.scrollHeight;
        } else {
          // For other messages, only scroll if already near bottom
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
          if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
          }
        }
      }
    }
  }, [messages, currentUserId]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-50 px-4">
      <div className="py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              isOwnMessage={msg.senderId === currentUserId}
              translatedText={translatedMessages[msg.id]}
              isLecturer={isLecturer}
              onDelete={onDeleteMessage}
            />
          ))
        )}
      </div>
    </div>
  );
}
