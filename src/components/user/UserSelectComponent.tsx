import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useUserSearch, SearchUser } from "@/hooks/useUserSearch";

interface UserSelectComponentProps {
  onSelectionChange: (selectedEmails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function UserSelectComponent({
  onSelectionChange,
  placeholder = "Search users by email or username",
  disabled = false,
  className = "",
}: UserSelectComponentProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    users,
    isLoading,
    searchUsers,
    selectedUsers,
    addUser,
    removeUser,
    clearSelection,
  } = useUserSearch();

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchUsers(query);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchUsers]);

  // Handle click outside to close dropdown
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

  // Notify parent when selection changes
  useEffect(() => {
    onSelectionChange(selectedUsers);
  }, [selectedUsers, onSelectionChange]);

  const handleSelectUser = (user: SearchUser) => {
    addUser(user.email);
    setQuery("");
    setShowResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowResults(true);
  };

  const handleRemoveUser = (email: string) => {
    removeUser(email);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div ref={wrapperRef} className="relative">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full"
          disabled={disabled}
        />

        {/* Search Results Dropdown */}
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
                    disabled={selectedUsers.includes(user.email)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {user.displayName?.[0] || user.email?.[0] || "?"}
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.displayName || user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                      {selectedUsers.includes(user.email) && (
                        <div className="ml-auto text-green-500 text-sm">
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                No users found
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Selected Users ({selectedUsers.length}):
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-red-500 hover:text-red-700"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedUsers.map((email, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-2 rounded border"
              >
                <span className="text-sm text-gray-700">{email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveUser(email)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
