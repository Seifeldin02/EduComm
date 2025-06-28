import { useState, useEffect, useRef } from "react";
import { db } from "@/firebase/firebaseConfig";
import {
  ref,
  push,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  get,
  endBefore,
} from "firebase/database";
import { Message, FileAttachment } from "@/types/chat";
import { toast } from "sonner";

const MESSAGES_PER_PAGE = 10;

export const useDirectMessages = (chatId: string, user: any | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const oldestMessageTimestampRef = useRef<number | null>(null);
  const messagesRef = useRef(ref(db, `directMessages/${chatId}`));
  const loadedMessageIdsRef = useRef(new Set<string>());
  const initialLoadDoneRef = useRef(false);

  // Load initial messages
  useEffect(() => {
    if (!user) return;

    const handleNewMessages = (snapshot: any) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = Object.entries(messagesData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          .filter((msg) => !loadedMessageIdsRef.current.has(msg.id))
          .sort((a, b) => a.timestamp - b.timestamp);

        if (messagesList.length > 0) {
          messagesList.forEach((msg) =>
            loadedMessageIdsRef.current.add(msg.id)
          );

          setMessages((prev) => {
            const prevMap = new Map(prev.map((m) => [m.id, m]));
            messagesList.forEach((msg) => prevMap.set(msg.id, msg));
            return Array.from(prevMap.values()).sort(
              (a, b) => a.timestamp - b.timestamp
            );
          });

          if (!initialLoadDoneRef.current && messagesList.length > 0) {
            oldestMessageTimestampRef.current = messagesList[0].timestamp;
          }
        }

        if (!initialLoadDoneRef.current) {
          setHasMoreMessages(
            Object.keys(messagesData).length >= MESSAGES_PER_PAGE
          );
        }
      } else {
        if (!initialLoadDoneRef.current) {
          setMessages([]);
          setHasMoreMessages(false);
        }
      }

      // Ensure isLoading is set to false and initialLoadDoneRef to true AFTER the first data handling
      if (!initialLoadDoneRef.current) {
        setIsLoading(false);
        initialLoadDoneRef.current = true;
      }
    };

    // Reset state for new chatId
    setIsLoading(true);
    setMessages([]);
    setHasMoreMessages(true);
    loadedMessageIdsRef.current.clear();
    oldestMessageTimestampRef.current = null;
    initialLoadDoneRef.current = false;
    messagesRef.current = ref(db, `directMessages/${chatId}`); // Update messagesRef when chatId changes

    const messagesQuery = query(
      messagesRef.current, // Use the updated messagesRef
      orderByChild("timestamp"),
      limitToLast(MESSAGES_PER_PAGE)
    );

    onValue(messagesQuery, handleNewMessages);

    return () => {
      off(messagesQuery); // Detach listener from the specific query
      // No need to clear loadedMessageIdsRef here as it's cleared when chatId changes
    };
  }, [chatId, user]); // chatID is a key dependency

  // Function to load older messages
  const loadMoreMessages = async () => {
    if (
      !user ||
      isLoadingMore ||
      !hasMoreMessages ||
      !oldestMessageTimestampRef.current ||
      !initialLoadDoneRef.current
    )
      return;

    setIsLoadingMore(true);

    try {
      const olderMessagesQuery = query(
        messagesRef.current,
        orderByChild("timestamp"),
        endBefore(oldestMessageTimestampRef.current),
        limitToLast(MESSAGES_PER_PAGE)
      );

      const snapshot = await get(olderMessagesQuery);

      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = Object.entries(messagesData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          .filter((msg) => !loadedMessageIdsRef.current.has(msg.id))
          .sort((a, b) => a.timestamp - b.timestamp);

        // Update loaded message IDs
        messagesList.forEach((msg) => loadedMessageIdsRef.current.add(msg.id));

        if (messagesList.length > 0) {
          oldestMessageTimestampRef.current = messagesList[0].timestamp;
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const uniqueNewMessages = messagesList.filter(
              (m) => !existingIds.has(m.id)
            );
            const combined = [...uniqueNewMessages, ...prev];
            return combined.sort((a, b) => a.timestamp - b.timestamp);
          });
          setHasMoreMessages(messagesList.length >= MESSAGES_PER_PAGE);
        } else {
          setHasMoreMessages(false);
        }
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      setHasMoreMessages(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sendMessage = async (newMessage: string): Promise<boolean> => {
    if (!user || !chatId) return false; // Ensure chatId is present
    try {
      const messageData = {
        text: newMessage,
        timestamp: Date.now(),
        senderId: user.uid,
        senderName:
          user.displayName || user.email?.split("@")[0] || "Unknown User",
        type: "text" as const,
      };
      const msgRef = await push(messagesRef.current, messageData);
      // Notify backend for unread/notification logic
      try {
        const token = await user.getIdToken();
        let lastMessagePreview = "";
        if (messageData.type === "text") {
          lastMessagePreview = messageData.text;
        } else if (messageData.type === "image") {
          lastMessagePreview = "[Image]";
        } else if (messageData.type === "file") {
          lastMessagePreview = "[File]";
        }
        await fetch(
          `http://localhost:3000/api/chats/${chatId}/notify-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              messageId: msgRef.key,
              timestamp: messageData.timestamp,
              lastMessage: lastMessagePreview,
            }),
          }
        );
      } catch (e) {
        /* ignore notify errors */
      }
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return false;
    }
  };

  const sendFileMessage = async (file: FileAttachment): Promise<boolean> => {
    if (!user || !chatId) return false;
    try {
      const messageData = {
        text: "",
        timestamp: Date.now(),
        senderId: user.uid,
        senderName:
          user.displayName || user.email?.split("@")[0] || "Unknown User",
        type: file.isImage ? "image" : ("file" as const),
        fileAttachment: file,
      };
      const msgRef = await push(messagesRef.current, messageData);
      // Notify backend for unread/notification logic
      try {
        const token = await user.getIdToken();
        let lastMessagePreview = "";
        if (messageData.type === "text") {
          lastMessagePreview = messageData.text;
        } else if (messageData.type === "image") {
          lastMessagePreview = "[Image]";
        } else if (messageData.type === "file") {
          lastMessagePreview = "[File]";
        }
        await fetch(
          `http://localhost:3000/api/chats/${chatId}/notify-message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              messageId: msgRef.key,
              timestamp: messageData.timestamp,
              lastMessage: lastMessagePreview,
            }),
          }
        );
      } catch (e) {
        /* ignore notify errors */
      }
      return true;
    } catch (error) {
      console.error("Error sending file message:", error);
      toast.error("Failed to send file");
      return false;
    }
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user || !chatId) return false;

    try {
      // Optimistically remove from local state
      const originalMessages = messages;
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      loadedMessageIdsRef.current.delete(messageId);

      const token = await user.getIdToken();
      const response = await fetch(
        `http://localhost:3000/api/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ chatId }),
        }
      );

      if (!response.ok) {
        // Revert optimistic update on failure
        setMessages(originalMessages);
        loadedMessageIdsRef.current.add(messageId);

        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete message");
      }

      toast.success("Message deleted");
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete message"
      );
      return false;
    }
  };

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    sendMessage,
    sendFileMessage,
    deleteMessage,
    loadMoreMessages,
    initialLoadDone: initialLoadDoneRef.current,
  };
};
