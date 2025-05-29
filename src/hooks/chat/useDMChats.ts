import { useState, useEffect } from "react";
import { db } from "@/firebase/firebaseConfig";
import { ref, push, get, set, onValue, off } from "firebase/database";

interface DMChat {
  id: string;
  participants: {
    [uid: string]: {
      displayName: string;
      email: string;
      photoURL?: string;
    };
  };
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
  };
}

export const useDMChats = (user: any | null) => {
  const [chats, setChats] = useState<DMChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const userChatsRef = ref(db, `userChats/${user.uid}`);

    const handleChatsUpdate = async (snapshot: any) => {
      if (!snapshot.exists()) {
        setChats([]);
        setIsLoading(false);
        return;
      }

      const chatIds = Object.keys(snapshot.val());
      const chatsData: DMChat[] = [];

      for (const chatId of chatIds) {
        const chatRef = ref(db, `chats/${chatId}`);
        const chatSnapshot = await get(chatRef);
        if (chatSnapshot.exists()) {
          const chatData = chatSnapshot.val();
          chatsData.push({
            id: chatId,
            ...chatData,
          });
        }
      }

      setChats(chatsData.sort((a, b) => {
        return (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0);
      }));
      setIsLoading(false);
    };

    onValue(userChatsRef, handleChatsUpdate);

    return () => {
      off(userChatsRef);
    };
  }, [user]);

  const createOrGetChat = async (otherUser: { uid: string; displayName: string; email: string; photoURL?: string }) => {
    if (!user) return null;

    // Check if chat already exists
    const userChatsRef = ref(db, `userChats/${user.uid}`);
    const userChatsSnapshot = await get(userChatsRef);
    
    if (userChatsSnapshot.exists()) {
      const userChats = userChatsSnapshot.val();
      const existingChatId = Object.keys(userChats).find(chatId => {
        const chat = userChats[chatId];
        return chat.participants && Object.keys(chat.participants).includes(otherUser.uid);
      });

      if (existingChatId) {
        return existingChatId;
      }
    }

    // Create new chat
    const newChatRef = push(ref(db, 'chats'));
    const chatId = newChatRef.key;

    if (!chatId) throw new Error('Failed to create chat');

    const chatData = {
      participants: {
        [user.uid]: {
          displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
          email: user.email,
          photoURL: user.photoURL,
        },
        [otherUser.uid]: {
          displayName: otherUser.displayName,
          email: otherUser.email,
          photoURL: otherUser.photoURL,
        },
      },
    };

    // Save chat data
    await set(newChatRef, chatData);

    // Add chat reference to both users
    await set(ref(db, `userChats/${user.uid}/${chatId}`), true);
    await set(ref(db, `userChats/${otherUser.uid}/${chatId}`), true);

    return chatId;
  };

  return {
    chats,
    isLoading,
    createOrGetChat,
  };
}; 