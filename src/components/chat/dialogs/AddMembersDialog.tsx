import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAutocomplete } from "@/components/user/UserAutocomplete";
import { AddMembersDialogProps } from "@/types/chat";

export function AddMembersDialog({ isOpen, onClose, onAdd }: AddMembersDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleSubmit = () => {
    onAdd(selectedUsers);
    setSelectedUsers([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0}
          >
            Add Selected Members
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 