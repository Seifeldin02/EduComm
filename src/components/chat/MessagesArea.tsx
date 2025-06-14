import { useEffect, useRef, useCallback } from "react";
import { Message as MessageType } from "@/types/chat";
import { Message } from "./Message";
import { Loader2 } from "lucide-react";

interface MessagesAreaProps {
  messages: MessageType[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  currentUserId?: string;
  isLecturer: boolean;
  translatedMessages: { [key: string]: string };
  onDeleteMessage: (messageId: string) => void;
  onLoadMore: () => void;
  initialLoadDone: boolean;
}

// Helper function to format dates
const formatMessageDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset hours to compare just the dates
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (messageDate.getTime() === todayDate.getTime()) {
    return "Today";
  } else if (messageDate.getTime() === yesterdayDate.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

// Group messages by date
const groupMessagesByDate = (messages: MessageType[]) => {
  const groups: { [date: string]: MessageType[] } = {};
  
  messages.forEach(message => {
    const date = formatMessageDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });

  return groups;
};

export function MessagesArea({
  messages,
  isLoading,
  isLoadingMore,
  hasMoreMessages,
  currentUserId,
  isLecturer,
  translatedMessages,
  onDeleteMessage,
  onLoadMore,
  initialLoadDone,
}: MessagesAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const shouldScrollToBottomRef = useRef(true);
  const isNearTopRef = useRef(false);

  // Handle scroll to maintain position when loading more messages
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !initialLoadDone) return;

    if (isNearTopRef.current && prevScrollHeightRef.current) {
      const scrollDiff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = scrollDiff;
      isNearTopRef.current = false;
    } else if (shouldScrollToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      shouldScrollToBottomRef.current = false;
    }
  }, [messages, initialLoadDone]);

  // Handle new messages
  useEffect(() => {
    if (!initialLoadDone || messages.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage.senderId === currentUserId;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isOwnMessage || isNearBottom) {
      shouldScrollToBottomRef.current = true;
    }
  }, [messages, currentUserId, initialLoadDone]);

  // Handle scroll and load more messages
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isLoadingMore || !hasMoreMessages || !initialLoadDone) return;

    const scrollTop = container.scrollTop;
    const isNearTop = scrollTop < 100;

    if (isNearTop) {
      isNearTopRef.current = true;
      prevScrollHeightRef.current = container.scrollHeight;
      onLoadMore();
    }
  }, [isLoadingMore, hasMoreMessages, onLoadMore, initialLoadDone]);

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto bg-gray-50 px-4"
      onScroll={handleScroll}
    >
      <div className="py-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="flex justify-center py-2">
                {isLoadingMore ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                ) : (
                  <button
                    onClick={() => {
                      if (containerRef.current) {
                        isNearTopRef.current = true;
                        prevScrollHeightRef.current = containerRef.current.scrollHeight;
                      }
                      onLoadMore();
                    }}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Load more messages
                  </button>
                )}
              </div>
            )}
            {Object.entries(messageGroups).map(([date, groupMessages]) => (
              <div key={date} className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {date}
                  </div>
                </div>
                <div className="space-y-4">
                  {groupMessages.map((msg) => (
                    <Message
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.senderId === currentUserId}
                      translatedText={translatedMessages[msg.id]}
                      isLecturer={isLecturer}
                      onDelete={onDeleteMessage}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
 