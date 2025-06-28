import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export interface AddMembersHook {
  isAdding: boolean;
  addMembers: (
    targetId: string,
    selectedEmails: string[],
    targetType?: "group" | "course"
  ) => Promise<boolean>;
}

export const useAddMembers = (): AddMembersHook => {
  const { user } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);

  const addMembers = async (
    targetId: string,
    selectedEmails: string[],
    targetType: "group" | "course" = "group"
  ): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to add members");
      return false;
    }

    if (!selectedEmails || selectedEmails.length === 0) {
      toast.error("Please select users to add");
      return false;
    }

    if (!targetId) {
      toast.error(`Invalid ${targetType} ID`);
      return false;
    }

    setIsAdding(true);

    try {
      const token = await user.getIdToken();

      // Determine the correct API endpoint based on target type
      const endpoint =
        targetType === "course"
          ? `http://localhost:3000/api/courses/${targetId}/students`
          : `http://localhost:3000/api/groups/${targetId}/members`;

      // Determine the correct body format based on target type
      const requestBody =
        targetType === "course"
          ? JSON.stringify({ studentEmails: selectedEmails })
          : JSON.stringify({ members: selectedEmails });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: requestBody,
      });

      const data = await response.json();

      if (response.ok) {
        // Check if any members were added (handle both groups and courses)
        const addedCount =
          data.addedMembers?.length || data.addedStudents?.length || 0;
        if (addedCount > 0) {
          const memberType = targetType === "course" ? "student" : "member";
          toast.success(
            `Added ${addedCount} ${memberType}${
              addedCount !== 1 ? "s" : ""
            } successfully`
          );
        } else {
          toast.info("No new members were added");
        }

        // Show warnings for any errors
        if (
          data.errors &&
          Array.isArray(data.errors) &&
          data.errors.length > 0
        ) {
          data.errors.forEach((error: string) => toast.warning(error));
        }

        return true;
      } else {
        // Handle API errors
        if (
          data.errors &&
          Array.isArray(data.errors) &&
          data.errors.length > 0
        ) {
          data.errors.forEach((error: string) => toast.error(error));
        } else if (data.error) {
          toast.error(data.error);
        } else {
          toast.error(`Failed to add members to ${targetType}`);
        }
        return false;
      }
    } catch (error: any) {
      console.error(`Error adding members to ${targetType}:`, error);
      toast.error(error.message || `Failed to add members to ${targetType}`);
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  return {
    isAdding,
    addMembers,
  };
};
