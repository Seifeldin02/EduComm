import React, { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
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
} from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Info,
  Users,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Globe,
  MoreVertical,
  Trash2,
  UserMinus,
} from "react-feather";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAutocomplete } from "@/components/user/UserAutocomplete";
import { GroupAvatar } from "@/components/ui/GroupAvatar";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message } from "./Message";
import { ChatSidebar } from "./ChatSidebar";
import { EditGroupDialog } from "./dialogs/EditGroupDialog";
import { AddMembersDialog } from "./dialogs/AddMembersDialog";
import { RemoveMemberDialog } from "./dialogs/RemoveMemberDialog";
import {
  TRANSLATION_LANGUAGES,
  detectLanguage,
  translateText,
} from "@/utils/translation";
import { Group, Member, Message as MessageType } from "@/types/chat";
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
