import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserSelectComponent } from "@/components/user/UserSelectComponent";
import { AddMembersDialogProps } from "@/types/chat";

export function AddMembersDialog({
  isOpen,
  onClose,
  onAdd,
}: AddMembersDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Reset selected users when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onAdd(selectedUsers);
    setSelectedUsers([]);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <UserSelectComponent
            onSelectionChange={setSelectedUsers}
            placeholder="Search users by email or username"
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0}
            className="min-w-[100px]"
          >
            Add {selectedUsers.length} Member
            {selectedUsers.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
