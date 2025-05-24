import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/firebase/firebaseConfig';
import { ref, push, onValue, off, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Info, Users, Edit2, ChevronRight, ChevronLeft, Globe } from 'react-feather';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAutocomplete } from '@/components/user/UserAutocomplete';
import { GroupAvatar } from '@/components/ui/GroupAvatar';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

interface Member {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  members: Member[];
  createdBy: string;
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

interface TranslationLanguage {
  code: string;
  name: string;
}

const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { code: "none", name: "No Translation" },
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ms", name: "Malay" },
  { code: "ar", name: "Arabic" }
];

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("none");
  const [translatedMessages, setTranslatedMessages] = useState<{[key: string]: string}>({});
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const messagesContainerRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch group info
  useEffect(() => {
    if (!groupId || !user) return;

    const fetchGroupInfo = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:3000/api/groups/${groupId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.group) {
            setGroupInfo(data.group);
            setEditName(data.group.name);
            setEditDescription(data.group.description || '');
            setEditImageUrl(data.group.imageUrl || '');
          } else {
            throw new Error("Failed to load group data");
          }
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to access group");
        }
      } catch (error) {
        console.error('Error fetching group info:', error);
        toast.error("Failed to load group data");
      }
    };

    fetchGroupInfo();
  }, [groupId, user]);

  // Messages listener
  useEffect(() => {
    if (!groupId || !user || !groupInfo) return;

    setIsLoading(true);
    const messagesRef = query(
      ref(db, `groupMessages/${groupId}`),
      orderByChild('timestamp'),
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
      off(messagesRef, 'value', callback);
      setIsLoading(false);
    };
  }, [groupId, user, groupInfo]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
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
      timestamp: serverTimestamp(),
    };

    try {
      const groupMessagesRef = ref(db, `groupMessages/${groupId}`);
      await push(groupMessagesRef, messageData);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleUpdateGroup = async () => {
    if (!user || !groupInfo) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:3000/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          imageUrl: editImageUrl,
        }),
      });

      if (response.ok) {
        setGroupInfo({
          ...groupInfo,
          name: editName,
          description: editDescription,
          imageUrl: editImageUrl,
        });
        setIsEditDialogOpen(false);
        toast.success('Group updated successfully');
      } else {
        throw new Error('Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleAddMembers = async () => {
    if (!user || !groupInfo || selectedUsers.length === 0) {
      toast.error('Please select users to add');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:3000/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ members: selectedUsers }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.addedMembers?.length > 0) {
          setGroupInfo({
            ...groupInfo,
            members: [...groupInfo.members, ...data.addedMembers]
          });
          setIsAddMembersDialogOpen(false);
          setSelectedUsers([]);
          toast.success(`Added ${data.addedMembers.length} members successfully`);
          
          if (data.errors?.length > 0) {
            data.errors.forEach((error: string) => toast.warning(error));
          }
        } else {
          toast.error(data.error || 'No members were added');
        }
      } else {
        if (data.errors?.length > 0) {
          data.errors.forEach((error: string) => toast.error(error));
        } else {
          throw new Error(data.error || 'Failed to add members');
        }
      }
    } catch (error: any) {
      console.error('Error adding members:', error);
      toast.error(error.message || 'Failed to add members');
    }
  };

  // Function to detect language
  const detectLanguage = async (text: string): Promise<string> => {
    try {
      console.log('Detecting language for text:', text);
      const response = await fetch('http://localhost:3000/api/translate/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: text }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Language detection failed. Status:', response.status, 'Response:', errorText);
        throw new Error(`Language detection failed: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Language detection response:', data);
      return data[0].language;
    } catch (error) {
      console.error('Error detecting language:', error);
      return 'en'; // Default to English if detection fails
    }
  };

  // Function to translate text
  const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    try {
      console.log('Translating text:', { text, sourceLang, targetLang });
      const response = await fetch('http://localhost:3000/api/translate/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: "text"
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Translation failed. Status:', response.status, 'Response:', errorText);
        throw new Error(`Translation failed: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Translation response:', data);
      return data.translatedText;
    } catch (error) {
      console.error('Error translating text:', error);
      return text; // Return original text if translation fails
    }
  };

  // Effect to handle message translation
  useEffect(() => {
    if (selectedLanguage === 'none') {
      setTranslatedMessages({});
      return;
    }

    const translateMessages = async () => {
      const newTranslations: {[key: string]: string} = {};
      
      for (const msg of messages) {
        try {
          // Always detect the source language for each message
          const sourceLang = await detectLanguage(msg.text);
          
          // Only translate if the source language is different from target
          if (sourceLang !== selectedLanguage) {
            const translatedText = await translateText(msg.text, sourceLang, selectedLanguage);
            // Only store translation if it's different from original
            if (translatedText !== msg.text) {
              newTranslations[msg.id] = translatedText;
            }
          }
        } catch (error) {
          console.error('Translation error for message:', msg.id, error);
        }
      }

      // Replace all translations when language changes
      setTranslatedMessages(newTranslations);
    };

    translateMessages();
  }, [messages, selectedLanguage]); // Only depend on messages and selectedLanguage

  return (
    <div className="flex h-screen">
      {/* Main Chat Area */}
      <div className={`flex flex-col ${showSidebar ? 'w-[calc(100%-320px)]' : 'w-full'} transition-all duration-300`}>
        {/* Fixed Header */}
        <div className="h-16 min-h-[64px] border-b border-gray-200 bg-white flex items-center px-4 justify-between">
          <div className="flex items-center space-x-3">
            <GroupAvatar name={groupInfo?.name || groupName} imageUrl={groupInfo?.imageUrl} size="sm" />
            <h2 className="text-lg font-semibold text-gray-800">{groupInfo?.name || groupName}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-md px-2 py-1">
              <Globe className="w-4 h-4 text-gray-500" />
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[140px] border-none bg-transparent">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSLATION_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showSidebar ? <ChevronRight className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      
        {/* Scrollable Messages Area */}
        <div 
          ref={messagesContainerRef} 
          className="flex-1 overflow-y-auto bg-gray-50 px-4"
        >
          <div className="py-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.senderId === user?.uid;
                const translatedText = translatedMessages[msg.id];
                const showTranslation = selectedLanguage !== 'none' && translatedText && translatedText !== msg.text;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md space-y-1`}>
                      {!isOwnMessage && (
                        <p className="text-xs font-medium text-gray-600 ml-2">
                          {msg.senderName}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg shadow ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white ml-12'
                            : 'bg-white text-gray-800 mr-12'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        {showTranslation && (
                          <div className={`mt-2 pt-2 border-t ${isOwnMessage ? 'border-blue-400' : 'border-gray-200'}`}>
                            <p className={`text-sm italic ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'}`}>
                              {translatedText}
                            </p>
                          </div>
                        )}
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="h-20 min-h-[80px] border-t border-gray-200 bg-white p-4">
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
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[320px] bg-white border-l border-gray-200 flex flex-col h-screen"
          >
            {/* Fixed Sidebar Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex justify-center mb-4">
                <GroupAvatar
                  name={groupInfo?.name || groupName}
                  imageUrl={groupInfo?.imageUrl}
                  size="xl"
                />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">{groupInfo?.name}</h3>
              <p className="text-gray-600 text-center text-sm">{groupInfo?.description}</p>
              {groupInfo?.createdBy === user?.uid && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Group
                </Button>
              )}
            </div>

            {/* Scrollable Members List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-700">Members ({groupInfo?.members.length})</h4>
                  {groupInfo?.createdBy === user?.uid && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddMembersDialogOpen(true)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {groupInfo?.members.map((member) => (
                    <div key={member.uid} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {member.displayName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.displayName}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      {member.role === 'Lecturer' && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Lecturer
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter group description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="Enter image URL"
              />
            </div>
            <Button className="w-full" onClick={handleUpdateGroup}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={isAddMembersDialogOpen} onOpenChange={setIsAddMembersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <UserAutocomplete
              selectedUsers={selectedUsers}
              onSelect={setSelectedUsers}
              placeholder="Search users by email or username"
            />
            <Button
              className="w-full"
              onClick={handleAddMembers}
              disabled={selectedUsers.length === 0}
            >
              Add Selected Members
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 