import { useState, useEffect } from "react";
import { Group, Member } from "@/types/chat";
import { toast } from "sonner";
import { db } from "@/firebase/firebaseConfig";
import { ref, remove } from "firebase/database";

export const useGroupManagement = (groupId: string, user: any | null) => {
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !user) return;

    const fetchGroupInfo = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `http://localhost:3000/api/groups/${groupId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.group) {
            setGroupInfo(data.group);
          } else {
            throw new Error("Failed to load group data");
          }
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to access group");
        }
      } catch (error) {
        console.error("Error fetching group info:", error);
        toast.error("Failed to load group data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupInfo();
  }, [groupId, user]);

  const updateGroup = async (name: string, description: string, imageUrl: string) => {
    if (!user || !groupInfo) return false;

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `http://localhost:3000/api/groups/${groupId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description,
            imageUrl,
          }),
        }
      );

      if (response.ok) {
        setGroupInfo({
          ...groupInfo,
          name,
          description,
          imageUrl,
        });
        toast.success("Group updated successfully");
        return true;
      } else {
        throw new Error("Failed to update group");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group");
      return false;
    }
  };

  const addMembers = async (selectedUsers: string[]) => {
    if (!user || !groupInfo || selectedUsers.length === 0) {
      toast.error("Please select users to add");
      return false;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `http://localhost:3000/api/groups/${groupId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ members: selectedUsers }),
        }
      );

      const data = await response.json();

      if (response.ok && data.addedMembers?.length > 0) {
        setGroupInfo({
          ...groupInfo,
          members: [...groupInfo.members, ...data.addedMembers],
        });
        toast.success(`Added ${data.addedMembers.length} members successfully`);

        if (data.errors?.length > 0) {
          data.errors.forEach((error: string) => toast.warning(error));
        }
        return true;
      } else {
        if (data.errors?.length > 0) {
          data.errors.forEach((error: string) => toast.error(error));
        }
        throw new Error(data.error || "Failed to add members");
      }
    } catch (error: any) {
      console.error("Error adding members:", error);
      toast.error(error.message || "Failed to add members");
      return false;
    }
  };

  const removeMember = async (member: Member, deleteMessages: boolean) => {
    if (!user || !groupId || !member) return false;

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `http://localhost:3000/api/groups/${groupId}/members/${member.uid}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deleteMessages }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      // If deleteMessages is true, delete all messages from this member
      if (deleteMessages) {
        const messagesRef = ref(db, `groupMessages/${groupId}`);
        const snapshot = await fetch(
          `http://localhost:3000/api/groups/${groupId}/messages?userId=${member.uid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (snapshot.ok) {
          const data = await snapshot.json();
          const messages = data.messages || {};

          // Delete messages from the removed member
          for (const messageId of Object.keys(messages)) {
            if (messages[messageId].senderId === member.uid) {
              await remove(ref(db, `groupMessages/${groupId}/${messageId}`));
            }
          }
        }
      }

      setGroupInfo(prev => {
        if (!prev) return null;
        return {
          ...prev,
          members: prev.members.filter(m => m.uid !== member.uid)
        };
      });

      toast.success("Member removed successfully");
      return true;
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
      return false;
    }
  };

  return {
    groupInfo,
    isLoading,
    updateGroup,
    addMembers,
    removeMember,
  };
}; 