import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL?: string | null;
}

interface UserAutocompleteProps {
  onSelect: (selectedUser: User | string[]) => void;
  placeholder?: string;
  selectedUsers?: string[];
}

export function UserAutocomplete({
  onSelect,
  placeholder = "Enter email address or username",
  selectedUsers,
}: UserAutocompleteProps) {
  const { user: currentUser } = useAuthStore();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchUsers = async () => {
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
        `http://localhost:3000/api/users/search?query=${encodeURIComponent(
          query
        )}`,
        {
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
          .filter((user: User) => user.uid !== currentUser?.uid)
          .sort((a: User, b: User) =>
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
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchUsers();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelectUser = (selectedUser: User) => {
    if (selectedUsers !== undefined && Array.isArray(selectedUsers)) {
      // If we're handling an array of selected users (multi-select mode)
      const updatedUsers = [...selectedUsers];
      if (!updatedUsers.includes(selectedUser.email)) {
        updatedUsers.push(selectedUser.email);
        onSelect(updatedUsers);
      }
    } else {
      // If we're handling a single user selection (single-select mode)
      onSelect(selectedUser);
    }
    setQuery("");
    setShowResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowResults(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
        placeholder={placeholder}
        className="w-full"
      />

      {showResults && (query.trim().length > 0 || isLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            </div>
          ) : users.length > 0 ? (
            <div className="py-1">
              {users.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => handleSelectUser(user)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {user.displayName?.[0] || user.email?.[0] || "?"}
                    </div>
                    <div>
                      <div className="font-medium">
                        {user.displayName || user.email}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-gray-500">No users found</div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}
