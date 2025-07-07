import { useState, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";
export interface SearchUser {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL?: string | null;
}

export interface UserSearchHook {
  users: SearchUser[];
  isLoading: boolean;
  searchUsers: (query: string) => Promise<void>;
  selectedUsers: string[];
  setSelectedUsers: (users: string[] | ((prev: string[]) => string[])) => void;
  addUser: (userEmail: string) => void;
  removeUser: (userEmail: string) => void;
  clearSelection: () => void;
}

export const useUserSearch = (): UserSearchHook => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const searchUsers = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2 || !currentUser) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        // Get the token first to avoid async issues
        let token;
        try {
          token = await currentUser.getIdToken(true); // Force refresh token
        } catch (tokenError) {
          console.error("Error getting token:", tokenError);
          toast.error("Authentication error. Please try again.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/users/search?query=${encodeURIComponent(
            query
          )}`,
          {
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Search API error:", response.status, errorData);
          throw new Error(`Failed to search users: ${response.status}`);
        }

        const data = await response.json();

        // Check if data.users exists and is an array
        if (!data.users || !Array.isArray(data.users)) {
          console.error("Unexpected response format:", data);
          setUsers([]);
          return;
        }

        // Filter out current user and sort results
        setUsers(
          data.users
            .filter((user: SearchUser) => user.uid !== currentUser?.uid)
            .sort((a: SearchUser, b: SearchUser) =>
              a.displayName.localeCompare(b.displayName)
            )
        );
      } catch (error) {
        console.error("Error searching users:", error);
        toast.error("Failed to search users");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  const addUser = (userEmail: string) => {
    if (!selectedUsers.includes(userEmail)) {
      setSelectedUsers((prev) => [...prev, userEmail]);
    }
  };

  const removeUser = (userEmail: string) => {
    setSelectedUsers((prev) => prev.filter((email) => email !== userEmail));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return {
    users,
    isLoading,
    searchUsers,
    selectedUsers,
    setSelectedUsers,
    addUser,
    removeUser,
    clearSelection,
  };
};
