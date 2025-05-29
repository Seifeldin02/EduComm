import { useState, useEffect, useRef } from "react";
import { db } from "@/firebase/firebaseConfig";
import {
  ref,
  push,
  onValue,
  off,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  get,
  startAt,
  endBefore,
} from "firebase/database";
import { Message } from "@/types/chat";
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
          .filter(msg => !loadedMessageIdsRef.current.has(msg.id))
          .sort((a, b) => a.timestamp - b.timestamp);

        if (messagesList.length > 0) {
          messagesList.forEach(msg => loadedMessageIdsRef.current.add(msg.id));

          setMessages(prev => {
            const prevMap = new Map(prev.map(m => [m.id, m]));
            messagesList.forEach(msg => prevMap.set(msg.id, msg));
            return Array.from(prevMap.values()).sort((a, b) => a.timestamp - b.timestamp);
          });

          if (!initialLoadDoneRef.current && messagesList.length > 0) {
            oldestMessageTimestampRef.current = messagesList[0].timestamp;
          }
        }
        
        if (!initialLoadDoneRef.current) {
            setHasMoreMessages(Object.keys(messagesData).length >= MESSAGES_PER_PAGE);
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
    if (!user || isLoadingMore || !hasMoreMessages || !oldestMessageTimestampRef.current || !initialLoadDoneRef.current) return;

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
          .filter(msg => !loadedMessageIdsRef.current.has(msg.id))
          .sort((a, b) => a.timestamp - b.timestamp);

        // Update loaded message IDs
        messagesList.forEach(msg => loadedMessageIdsRef.current.add(msg.id));

        if (messagesList.length > 0) {
          oldestMessageTimestampRef.current = messagesList[0].timestamp;
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNewMessages = messagesList.filter(m => !existingIds.has(m.id));
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
        timestamp: Date.now(), // Or serverTimestamp()
        senderId: user.uid,
        senderName: user.displayName || user.email?.split("@")[0] || "Unknown User",
      };

      // Use the current messagesRef which is updated when chatId changes
      await push(messagesRef.current, messageData); 
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message"); // Added toast
      return false;
    }
  };

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    sendMessage,
    loadMoreMessages,
    initialLoadDone: initialLoadDoneRef.current,
  };
}; 