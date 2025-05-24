export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface Member {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  members: Member[];
  createdBy: string;
}

export interface TranslationLanguage {
  code: string;
  name: string;
}

export interface GroupChatProps {
  groupId: string;
  groupName: string;
}

export interface MessageProps {
  message: Message;
  isOwnMessage: boolean;
  translatedText?: string;
  isLecturer: boolean;
  onDelete: (messageId: string) => void;
}

export interface SidebarProps {
  group: Group | null;
  expanded: boolean;
  onExpand: (expanded: boolean) => void;
  onEdit: () => void;
  onAddMembers: () => void;
  onRemoveMember: (member: Member) => void;
  currentUserId?: string;
}

export interface MemberItemProps {
  member: Member;
  isLecturer: boolean;
  isCreator: boolean;
  onRemove: (member: Member) => void;
}

export interface EditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  onUpdate: (name: string, description: string, imageUrl: string) => void;
}

export interface AddMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (members: string[]) => void;
}

export interface RemoveMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onConfirm: (deleteMessages: boolean) => void;
} 