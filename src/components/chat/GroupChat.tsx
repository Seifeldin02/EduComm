import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatSidebar } from "./ChatSidebar";
import { EditGroupDialog } from "./dialogs/EditGroupDialog";
import { AddMembersDialog } from "./dialogs/AddMembersDialog";
import { RemoveMemberDialog } from "./dialogs/RemoveMemberDialog";
import { Member } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { MessagesArea } from "./MessagesArea";
import { ChatInput } from "./ChatInput";
import { useMessages } from "@/hooks/chat/useMessages";
import { useTranslation } from "@/hooks/chat/useTranslation";
import { useGroupManagement } from "@/hooks/chat/useGroupManagement";

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { user } = useAuthStore();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] =
    useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Custom hooks
  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    deleteMessage,
  } = useMessages(groupId, user);
  const { selectedLanguage, setSelectedLanguage, translatedMessages } =
    useTranslation(messages);
  const {
    groupInfo,
    isLoading: groupLoading,
    updateGroup,
    addMembers,
    removeMember,
  } = useGroupManagement(groupId, user);

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    await deleteMessage(messageId);
  };

  const handleRemoveMember = async (deleteMessages: boolean) => {
    if (!selectedMember) return;
    if (await removeMember(selectedMember, deleteMessages)) {
      setIsRemoveMemberDialogOpen(false);
      setSelectedMember(null);
    }
  };

  const isLecturer = groupInfo?.createdBy === user?.uid;

  return (
    <div className="flex h-[82vh]">
      {/* Main Chat Area */}
      <div
        className={`flex flex-col ${
          showSidebar ? "w-[calc(100%-320px)]" : "w-full"
        } transition-all duration-300`}
      >
        <ChatHeader
          groupInfo={groupInfo}
          groupName={groupName}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />

        <MessagesArea
          messages={messages}
          isLoading={messagesLoading}
          currentUserId={user?.uid}
          isLecturer={isLecturer}
          translatedMessages={translatedMessages}
          onDeleteMessage={handleDeleteMessage}
        />

        <ChatInput onSendMessage={sendMessage} />
      </div>

      {/* Sidebar */}
      <ChatSidebar
        group={groupInfo}
        expanded={showSidebar}
        onExpand={setShowSidebar}
        onEdit={() => setIsEditDialogOpen(true)}
        onAddMembers={() => setIsAddMembersDialogOpen(true)}
        onRemoveMember={(member) => {
          setSelectedMember(member);
          setIsRemoveMemberDialogOpen(true);
        }}
        currentUserId={user?.uid}
      />

      {/* Dialogs */}
      <EditGroupDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        group={groupInfo}
        onUpdate={updateGroup}
      />

      <AddMembersDialog
        isOpen={isAddMembersDialogOpen}
        onClose={() => setIsAddMembersDialogOpen(false)}
        onAdd={addMembers}
      />

      <RemoveMemberDialog
        isOpen={isRemoveMemberDialogOpen}
        onClose={() => setIsRemoveMemberDialogOpen(false)}
        member={selectedMember}
        onConfirm={handleRemoveMember}
      />
    </div>
  );
} 
