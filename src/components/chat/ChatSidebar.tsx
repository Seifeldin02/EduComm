import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Users } from "react-feather";
import { Button } from "@/components/ui/button";
import { GroupAvatar } from "@/components/ui/GroupAvatar";
import { MemberItem } from "./MemberItem";
import { SidebarProps } from "@/types/chat";

export function ChatSidebar({
  group,
  expanded,
  onEdit,
  onAddMembers,
  onRemoveMember,
  currentUserId,
}: SidebarProps) {
  return (
    <AnimatePresence>
      {expanded && (
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
                name={group?.name || ""}
                imageUrl={group?.imageUrl}
                size="xl"
              />
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">
              {group?.name}
            </h3>
            <p className="text-gray-600 text-center text-sm">
              {group?.description}
            </p>
            {group?.createdBy === currentUserId && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={onEdit}
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
                <h4 className="font-semibold text-gray-700">
                  Members ({group?.members.length})
                </h4>
                {group?.createdBy === currentUserId && (
                  <Button variant="ghost" size="sm" onClick={onAddMembers}>
                    <Users className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {group?.members.map((member) => (
                  <MemberItem
                    key={member.uid}
                    member={member}
                    isLecturer={group.createdBy === currentUserId}
                    isCreator={member.uid === group.createdBy}
                    onRemove={onRemoveMember}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
