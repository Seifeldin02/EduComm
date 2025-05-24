import { useState, useEffect } from "react";
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
  remove,
} from "firebase/database";
import { Message } from "@/types/chat";
import { toast } from "sonner";

export const useMessages = (groupId: string, user: any | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !user) return;

    setIsLoading(true);
    const messagesRef = query(
      ref(db, `groupMessages/${groupId}`),
      orderByChild("timestamp"),
      limitToLast(50)
    );

    const callback = onValue(messagesRef, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((childSnapshot) => {
        loadedMessages.push({ id: childSnapshot.key!, ...childSnapshot.val() });
      });
      setMessages(loadedMessages);
      setIsLoading(false);
    });

    return () => {
      off(messagesRef, "value", callback);
      setIsLoading(false);
    };
  }, [groupId, user]);

  const sendMessage = async (newMessage: string): Promise<boolean> => {
    if (!newMessage.trim() || !user || !groupId) return false;

    const messageData = {
      text: newMessage,
      senderId: user.uid,
      senderName: user.displayName || user.email?.split("@")[0] || "Anonymous",
      timestamp: serverTimestamp(),
    };

    try {
      const groupMessagesRef = ref(db, `groupMessages/${groupId}`);
      await push(groupMessagesRef, messageData);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return false;
    }
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user || !groupId) return false;

    try {
      // Delete directly from Firebase Realtime Database
      const messageRef = ref(db, `groupMessages/${groupId}/${messageId}`);
      await remove(messageRef);
      toast.success("Message deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
      return false;
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
  };
}; 