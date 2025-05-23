import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "react-feather";
import { toast } from "sonner";

interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
}

interface UserAutocompleteProps {
  onSelect: (selectedUsers: string[]) => void;
  selectedUsers: string[];
  placeholder?: string;
}

export function UserAutocomplete({ onSelect, selectedUsers, placeholder = "Enter email addresses or usernames" }: UserAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || !user) {
        setUsers([]);
        return;
      }

      try {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        setLoading(true);

        const token = await user.getIdToken();
        const res = await fetch(
          `http://localhost:3000/api/users/search?query=${encodeURIComponent(searchTerm)}`,
          {
            method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            signal: abortControllerRef.current.signal,
            credentials: 'include',
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to search users' }));
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setUsers(data.users || []);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Ignore abort errors
          return;
        }
        console.error('Error searching users:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to search users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => {
      clearTimeout(debounce);
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, user]);

  const handleSelectUser = (selectedUser: User) => {
    if (!selectedUsers.includes(selectedUser.email)) {
      onSelect([...selectedUsers, selectedUser.email]);
    setSearchTerm("");
    setUsers([]);
      inputRef.current?.focus();
    }
  };

  const handleRemoveUser = (email: string) => {
    onSelect(selectedUsers.filter(e => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && searchTerm === '' && selectedUsers.length > 0) {
      e.preventDefault();
      const lastUser = selectedUsers[selectedUsers.length - 1];
      handleRemoveUser(lastUser);
    } else if (e.key === 'Escape') {
      setUsers([]);
      setSearchTerm('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value.trim()) {
      setUsers([]);
    }
  };

  const handleBlur = () => {
    // Use setTimeout to allow click events on the suggestions to fire first
    setTimeout(() => {
      setUsers([]);
    }, 200);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        )}
        {users.length > 0 && searchTerm.trim() && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.uid}
                type="button"
                onClick={() => handleSelectUser(user)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                <div className="font-medium">{user.displayName}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                {user.username && (
                  <div className="text-xs text-gray-400">@{user.username}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((email) => (
            <div
              key={email}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span>{email}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveUser(email)}
                className="h-4 w-4 p-0 hover:bg-gray-200"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 