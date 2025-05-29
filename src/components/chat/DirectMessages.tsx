import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDMChats } from "@/hooks/chat/useDMChats";
import { useDirectMessages } from "@/hooks/chat/useDirectMessages";
import { UserAutocomplete } from "@/components/user/UserAutocomplete";
import { MessagesArea } from "./MessagesArea";
import { ChatInput } from "./ChatInput";
import { useTranslation } from "@/hooks/chat/useTranslation";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "react-feather";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { toast } from "sonner";

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
    loadMoreMessages,
    initialLoadDone,
  } = useDirectMessages(selectedChatId || "", user);

  const { selectedLanguage, setSelectedLanguage, translatedMessages } = useTranslation(messages);

  const handleStartChat = async (selectedUser: any) => {
    try {
      const chatId = await createOrGetChat(selectedUser);
      if (chatId) {
        setSelectedChatId(chatId);
        setShowNewChat(false);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    }
  };

  const getOtherParticipant = (chat: any) => {
    if (!user || !chat.participants) return null;
    const otherParticipantId = Object.keys(chat.participants).find(id => id !== user.uid);
    return otherParticipantId ? chat.participants[otherParticipantId] : null;
  };

  return (
    <div className="flex h-[82vh]">
      {/* Chats Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={() => setShowNewChat(true)}
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            chats.map(chat => {
              const otherParticipant = getOtherParticipant(chat);
              if (!otherParticipant) return null;

              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                    selectedChatId === chat.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {otherParticipant.photoURL ? (
                      <img
                        src={otherParticipant.photoURL}
                        alt={otherParticipant.displayName}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-600">
                        {otherParticipant.displayName[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{otherParticipant.displayName}</p>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage.text}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 min-h-[64px] border-b border-gray-200 bg-white flex items-center px-4">
              {chats.find(c => c.id === selectedChatId) && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {getOtherParticipant(chats.find(c => c.id === selectedChatId))?.displayName[0]}
                  </div>
                  <h2 className="font-medium">
                    {getOtherParticipant(chats.find(c => c.id === selectedChatId))?.displayName}
                  </h2>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <MessagesArea
              messages={messages}
              isLoading={messagesLoading}
              isLoadingMore={isLoadingMore}
              hasMoreMessages={hasMoreMessages}
              currentUserId={user?.uid}
              isLecturer={false}
              translatedMessages={translatedMessages}
              onDeleteMessage={() => {}}
              onLoadMore={loadMoreMessages}
              initialLoadDone={initialLoadDone}
            />

            {/* Chat Input */}
            <ChatInput onSendMessage={sendMessage} />
          </>
        ) : showNewChat ? (
          <AnimationWrapper>
            <div className="h-full flex flex-col">
              <div className="h-16 min-h-[64px] border-b border-gray-200 bg-white flex items-center justify-between px-4">
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