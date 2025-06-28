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
import { useAddMembers } from "@/hooks/useAddMembers";
import { Loader2 } from "lucide-react";

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetId: string;
  targetType?: "group" | "course";
  title?: string;
}

export function AddMembersModal({
  isOpen,
  onClose,
  onSuccess,
  targetId,
  targetType = "group",
  title,
}: AddMembersModalProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const { isAdding, addMembers } = useAddMembers();

  // Reset selected emails when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmails([]);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (selectedEmails.length === 0) {
      return;
    }

    const success = await addMembers(targetId, selectedEmails, targetType);

    if (success) {
      setSelectedEmails([]);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      onClose();
    }
  };

  const modalTitle =
    title || `Add Members to ${targetType === "course" ? "Course" : "Group"}`;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isAdding) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <UserSelectComponent
            onSelectionChange={setSelectedEmails}
            placeholder="Search users by email or username"
            disabled={isAdding}
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedEmails.length === 0 || isAdding}
            className="min-w-[100px]"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${selectedEmails.length} Member${
                selectedEmails.length !== 1 ? "s" : ""
              }`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
