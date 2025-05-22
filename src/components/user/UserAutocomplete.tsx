import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "react-feather";

interface User {
  uid: string;
  email: string;
  displayName: string;
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

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || !user) return;

      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await fetch(`http://localhost:3000/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to search users');
        const data = await res.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, user]);

  const handleSelectUser = (selectedUser: User) => {
    if (!selectedUsers.includes(selectedUser.email)) {
      onSelect([...selectedUsers, selectedUser.email]);
    }
    setSearchTerm("");
    setUsers([]);
  };

  const handleRemoveUser = (email: string) => {
    onSelect(selectedUsers.filter(e => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && searchTerm === '' && selectedUsers.length > 0) {
      e.preventDefault();
      const lastUser = selectedUsers[selectedUsers.length - 1];
      handleRemoveUser(lastUser);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        )}
        {users.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
            {users.map((user) => (
              <button
                key={user.uid}
                onClick={() => handleSelectUser(user)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium">{user.displayName}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
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