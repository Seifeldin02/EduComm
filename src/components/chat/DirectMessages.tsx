import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDMChats } from "@/hooks/chat/useDMChats";
import { useDirectMessages } from "@/hooks/chat/useDirectMessages";
import { UserAutocomplete } from "@/components/user/UserAutocomplete";
import { MessagesArea } from "./MessagesArea";
import { ChatInput } from "./ChatInput";
import { useTranslation } from "@/hooks/chat/useTranslation";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Globe } from "react-feather";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSLATION_LANGUAGES } from "@/utils/translation";
import { firestore } from "@/firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function DirectMessages() {
  const { user } = useAuthStore();
  const { chats, isLoading: chatsLoading, createOrGetChat } = useDMChats(user);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  // Get messages for selected chat
  const {
    messages,
    isLoading: messagesLoading,
    isLoadingMore,
    hasMoreMessages,
    sendMessage,
    sendFileMessage,
    deleteMessage,
    loadMoreMessages,
    initialLoadDone,
  } = useDirectMessages(selectedChatId || "", user);

  const { selectedLanguage, setSelectedLanguage, translatedMessages } =
    useTranslation(messages);

  useEffect(() => {
    const markDMNotificationsAsRead = async () => {
      if (!user || !selectedChatId || messages.length === 0) return;

      try {
        const notificationsQuery = query(
          collection(firestore, "notifications"),
          where("recipientId", "==", user.uid),
          where("read", "==", false),
          where("type", "==", "message"),
          where("metadata.chatId", "==", selectedChatId)
        );

        const querySnapshot = await getDocs(notificationsQuery);

        const updatePromises = querySnapshot.docs.map((docSnapshot) =>
          updateDoc(doc(firestore, "notifications", docSnapshot.id), {
            read: true,
          })
        );

        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    };

    markDMNotificationsAsRead();
  }, [user, selectedChatId, messages]);

  const handleStartChat = async (selectedUser: any) => {
    if (!user) {
      toast.error("Please log in to start a chat");
      return;
    }

    try {
      // Validate selected user
      if (!selectedUser || typeof selectedUser !== "object") {
        console.error("Invalid selected user:", selectedUser);
        toast.error("Invalid user selected");
        return;
      }

      if (!selectedUser.uid) {
        console.error("Selected user missing UID:", selectedUser);
        toast.error("Cannot start chat - user information is incomplete");
        return;
      }

      console.log("Starting chat with user:", selectedUser);
      const chatId = await createOrGetChat(selectedUser);
      if (chatId) {
        console.log("Chat created/found:", chatId);
        setSelectedChatId(chatId);
        setShowNewChat(false);

        // Check if this is an existing chat or new one
        const existingChat = chats.find((chat) => chat.id === chatId);
        if (existingChat) {
          toast.success("Redirected to existing conversation");
        } else {
          toast.success("Chat started successfully!");
        }
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    await deleteMessage(messageId);
  };

  const getOtherParticipant = (chat: any) => {
    if (!user || !chat.participants) return null;
    const otherParticipantId = Object.keys(chat.participants).find(
      (id) => id !== user.uid
    );
    return otherParticipantId ? chat.participants[otherParticipantId] : null;
  };

  return (
    <div className="flex h-[70vh] max-h-[70vh]">
      {/* Chats Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <Button
            onClick={() => {
              setSelectedChatId(null);
              setShowNewChat(true);
            }}
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
        {/* Chats List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {chatsLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat);
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    setShowNewChat(false);
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChatId === chat.id
                      ? "bg-blue-50 border-blue-200"
                      : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                      {otherParticipant?.displayName?.[0] ||
                        otherParticipant?.email?.[0] ||
                        "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {otherParticipant?.displayName ||
                          otherParticipant?.email ||
                          "Unknown User"}
                      </div>
                      {chat.lastMessage && (
                        <div className="text-sm text-gray-500 truncate">
                          {chat.lastMessage.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {selectedChatId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 min-h-[64px] border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  {(() => {
                    const chat = chats.find((c) => c.id === selectedChatId);
                    const otherParticipant = getOtherParticipant(chat);
                    return (
                      otherParticipant?.displayName?.[0] ||
                      otherParticipant?.email?.[0] ||
                      "?"
                    );
                  })()}
                </div>
                <h2 className="font-medium">
                  {(() => {
                    const chat = chats.find((c) => c.id === selectedChatId);
                    const otherParticipant = getOtherParticipant(chat);
                    return (
                      otherParticipant?.displayName ||
                      otherParticipant?.email ||
                      "Unknown User"
                    );
                  })()}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <Select
                  value={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
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
            </div>

            {/* Messages Area */}
            <MessagesArea
              key={selectedChatId} // Force remount when chat changes
              messages={messages}
              isLoading={messagesLoading}
              isLoadingMore={isLoadingMore}
              hasMoreMessages={hasMoreMessages}
              currentUserId={user?.uid}
              isLecturer={false}
              translatedMessages={translatedMessages}
              onDeleteMessage={handleDeleteMessage}
              onLoadMore={loadMoreMessages}
              initialLoadDone={initialLoadDone}
            />

            {/* Chat Input */}
            <ChatInput
              onSendMessage={sendMessage}
              onSendFile={sendFileMessage}
            />
          </>
        ) : showNewChat ? (
          <AnimationWrapper>
            <div className="h-full flex flex-col">
              <div className="h-16 min-h-[64px] border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
                <h2 className="font-medium">New Message</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowNewChat(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-4">
                <UserAutocomplete
                  onSelect={handleStartChat}
                  placeholder="Type a name or email to start a conversation"
                />
              </div>
            </div>
          </AnimationWrapper>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
