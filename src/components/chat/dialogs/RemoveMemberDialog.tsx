import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RemoveMemberDialogProps } from "@/types/chat";

export function RemoveMemberDialog({ isOpen, onClose, member, onConfirm }: RemoveMemberDialogProps) {
  const [deleteMessages, setDeleteMessages] = useState(false);

  const handleConfirm = () => {
    onConfirm(deleteMessages);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-gray-900">{member?.displayName}</span>?
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="deleteMessages"
              checked={deleteMessages}
              onChange={(e) => setDeleteMessages(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="deleteMessages" className="text-sm text-gray-600">
              Also delete all messages from this member
            </label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-24"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              className="w-24"
            >
              Remove
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 