import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/firebase/firebaseConfig'; // Assuming db is Realtime Database instance
import { ref, push, onValue, off, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { motion } from 'framer-motion';
import { Send } from 'react-feather';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number; // Will store Firebase server timestamp
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const messagesContainerRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!groupId || !user) return;

    const messagesRef = query(
      ref(db, `groupMessages/${groupId}`),
      orderByChild('timestamp'),
      limitToLast(50) // Fetch last 50 messages initially
    );

    const callback = onValue(messagesRef, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((childSnapshot) => {
        loadedMessages.push({ id: childSnapshot.key!, ...childSnapshot.val() });
      });
      setMessages(loadedMessages);
    });

    // Cleanup listener on component unmount
    return () => off(messagesRef, 'value', callback);
  }, [groupId, user]);

  useEffect(() => {
    // Scroll to bottom when messages change, but only if user is near the bottom
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200; // If user is within 200px of the bottom
      if (isNearBottom) {
        scrollToBottom("auto");
      }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !groupId) return;

    const messageData = {
      text: newMessage,
      senderId: user.uid,
      senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      timestamp: serverTimestamp(), // Firebase server timestamp
    };

    try {
      const groupMessagesRef = ref(db, `groupMessages/${groupId}`);
      await push(groupMessagesRef, messageData);
      setNewMessage('');
      scrollToBottom(); // Scroll after sending a new message
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">{groupName}</h2>
      </header>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                msg.senderId === user?.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              {msg.senderId !== user?.uid && (
                <p className="text-xs font-semibold mb-1 ${msg.senderId === user?.uid ? 'text-blue-100' : 'text-gray-600'}">
                  {msg.senderName}
                </p>
              )}
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.senderId === user?.uid ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="bg-white p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" variant="default" size="icon" disabled={!newMessage.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
} 