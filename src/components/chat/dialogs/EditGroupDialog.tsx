import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditGroupDialogProps } from "@/types/chat";

export function EditGroupDialog({ isOpen, onClose, group, onUpdate }: EditGroupDialogProps) {
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  useEffect(() => {
    if (group) {
      setEditName(group.name);
      setEditDescription(group.description);
      setEditImageUrl(group.imageUrl || "");
    }
  }, [group]);

  const handleSubmit = () => {
    onUpdate(editName, editDescription, editImageUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter group description"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
              placeholder="Enter image URL"
            />
          </div>
          <Button className="w-full" onClick={handleSubmit}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 