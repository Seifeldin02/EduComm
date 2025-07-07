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
import { API_CONFIG } from "@/config/api";
const MESSAGES_PER_PAGE = 10;

export const useMessages = (groupId: string, user: any | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const oldestMessageTimestampRef = useRef<number | null>(null);
  const messagesRef = useRef(ref(db, `groupMessages/${groupId}`));
  const loadedMessageIdsRef = useRef(new Set<string>());
  const initialLoadDoneRef = useRef(false);

  // Load initial messages
  useEffect(() => {
    if (!user) return;

    const messagesQuery = query(
      messagesRef.current,
      orderByChild("timestamp"),
      limitToLast(MESSAGES_PER_PAGE)
    );

    const handleNewMessages = (snapshot: any) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const allMessages = Object.entries(messagesData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        // Always sync with Firebase snapshot to handle both additions and deletions
        setMessages(allMessages);

        // Update loaded message IDs to reflect current state
        loadedMessageIdsRef.current = new Set(allMessages.map((msg) => msg.id));

        // Only update oldestMessageTimestampRef on the VERY FIRST load from this listener
        if (!initialLoadDoneRef.current && allMessages.length > 0) {
          oldestMessageTimestampRef.current = allMessages[0].timestamp;
        }

        // Determine hasMoreMessages based on whether the fetched chunk was full
        if (!initialLoadDoneRef.current) {
          setHasMoreMessages(
            Object.keys(messagesData).length >= MESSAGES_PER_PAGE
          );
        }
      } else {
        // No messages initially, or all messages were deleted
        setMessages([]);
        setHasMoreMessages(false);
        loadedMessageIdsRef.current.clear();
      }

      if (!initialLoadDoneRef.current) {
        setIsLoading(false);
        initialLoadDoneRef.current = true;
      }
    };

    onValue(messagesQuery, handleNewMessages);

    return () => {
      off(messagesQuery);
      loadedMessageIdsRef.current.clear();
      initialLoadDoneRef.current = false;
    };
  }, [groupId, user]);

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
          // THIS IS THE CORRECT PLACE TO UPDATE oldestMessageTimestampRef for pagination
          oldestMessageTimestampRef.current = messagesList[0].timestamp;

          setMessages((prev) => {
            // Prevent duplicates when loading more
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
    if (!user) return false;
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
          `${API_CONFIG.BASE_URL}/api/groups/${groupId}/notify-message`,
          {
            method: "POST",
            credentials: "include",
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
      return false;
    }
  };

  const sendFileMessage = async (file: FileAttachment): Promise<boolean> => {
    if (!user) return false;
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
          `${API_CONFIG.BASE_URL}/api/groups/${groupId}/notify-message`,
          {
            method: "POST",
            credentials: "include",
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
    if (!user) return false;

    try {
      console.log(
        `Attempting to delete message ${messageId} from group ${groupId}`
      );
      const token = await user.getIdToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/groups/${groupId}/messages/${messageId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`Delete response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Delete failed with error:`, errorData);
        throw new Error(errorData.error || "Failed to delete message");
      }

      console.log("Message deleted successfully");
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
