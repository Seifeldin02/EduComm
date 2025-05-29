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

    const messagesQuery = query(
      messagesRef.current,
      orderByChild("timestamp"),
      limitToLast(MESSAGES_PER_PAGE)
    );

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

        // Update loaded message IDs
        messagesList.forEach(msg => loadedMessageIdsRef.current.add(msg.id));

        if (messagesList.length > 0) {
          oldestMessageTimestampRef.current = messagesList[0].timestamp;
          setMessages(prev => {
            const newMessages = [...prev];
            messagesList.forEach(msg => {
              if (!newMessages.some(m => m.id === msg.id)) {
                newMessages.push(msg);
              }
            });
            return newMessages.sort((a, b) => a.timestamp - b.timestamp);
          });
        }

        setHasMoreMessages(messagesList.length >= MESSAGES_PER_PAGE);
      } else {
        setMessages([]);
        setHasMoreMessages(false);
      }
      
      setIsLoading(false);
      initialLoadDoneRef.current = true;
    };

    onValue(messagesQuery, handleNewMessages);

    return () => {
      off(messagesQuery);
      loadedMessageIdsRef.current.clear();
      initialLoadDoneRef.current = false;
    };
  }, [chatId, user]);

  // Function to load older messages
  const loadMoreMessages = async () => {
    if (!user || isLoadingMore || !hasMoreMessages || !oldestMessageTimestampRef.current) return;

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
            const newMessages = [...messagesList, ...prev];
            return newMessages.sort((a, b) => a.timestamp - b.timestamp);
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
        senderName: user.displayName || user.email?.split("@")[0] || "Unknown User",
      };

      await push(messagesRef.current, messageData);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
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