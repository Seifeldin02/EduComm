// src/views/dashboard/CreateGroup.tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { Plus, Edit2, Trash2, MessageCircle } from "react-feather";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserAutocomplete } from "@/components/user/UserAutocomplete";
import { GroupAvatar } from "@/components/ui/GroupAvatar";
import { useNavigate } from "react-router-dom";

interface Group {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  members: Array<{
    uid: string;
    email: string;
    displayName: string;
  }>;
  createdAt: string;
  createdBy: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const listVariants = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  hidden: {
    opacity: 0,
    transition: {
      when: "afterChildren"
    }
  }
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:3000/api/groups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await res.json();
      console.log('Fetched groups:', data); // Debug log
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:3000/api/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
      },
        body: JSON.stringify({ name, description, imageUrl }),
    });

    if (res.ok) {
        toast.success("Group created successfully!");
        setIsCreateOpen(false);
      setName("");
        setDescription("");
        setImageUrl("");
        
        // First fetch the latest groups data
        await fetchGroups();
        
        // Then refresh the entire page
        window.location.reload();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create group");
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:3000/api/groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, imageUrl }),
      });

      if (res.ok) {
        toast.success("Group updated successfully!");
        setIsEditOpen(false);
        fetchGroups();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to update group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:3000/api/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Group deleted successfully!");
        fetchGroups();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    // newMembers is now an array of email addresses
    if (newMembers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      setLoading(true);
      const token = await user?.getIdToken();
      
      // Create the request with proper headers
      const response = await fetch(`http://localhost:3000/api/groups/${selectedGroup.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ members: newMembers }),
      });

      // Check for non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response received:", await response.text());
        throw new Error("Server returned non-JSON response. Please check server logs.");
      }

      // Parse the JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        console.error("Response status:", response.status, response.statusText);
        throw new Error("Failed to parse server response. Please check server logs.");
      }

      // Handle successful response
      if (response.ok) {
        if (data.errors?.length > 0) {
          const errorMessages = data.errors.map((err: { email: string; error: string }) => 
            `${err.email}: ${err.error}`
          ).join(', ');
          
          if (data.addedMembers.length > 0) {
            toast.warning(`Added ${data.addedMembers.length} members. Some members couldn't be added: ${errorMessages}`);
          } else {
            toast.error(`Failed to add members: ${errorMessages}`);
          }
        } else {
          toast.success(`Added ${data.addedMembers.length} members successfully!`);
        }
        setIsAddMembersOpen(false);
        setNewMembers([]);
        await fetchGroups();
      } else {
        // Handle error response
        throw new Error(data.error || data.details || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error(error instanceof Error ? error.message : "Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/lecturer/group-chat/${groupId}`);
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">My Groups</h1>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Group</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter group name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter group description"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image URL (optional)</label>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Enter image URL"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Group
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You haven't created any groups yet.
            </div>
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {groups.map((group) => (
                <motion.div
                  key={group.id}
                  variants={cardVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  <div 
                    className="relative h-48 bg-gray-100 flex items-center justify-center group"
                    onClick={() => handleGroupClick(group.id)}
                  >
                    <GroupAvatar 
                      name={group.name} 
                      imageUrl={group.imageUrl} 
                      size="xl" 
                      className="w-32 h-32 transition-opacity group-hover:opacity-80"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-2 shadow-lg">
                        <MessageCircle className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(group);
                            setName(group.name);
                            setDescription(group.description);
                            setImageUrl(group.imageUrl || '');
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1 line-clamp-2">{group.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {group.members.length} members
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(group);
                          setNewMembers([]);
                          setIsAddMembersOpen(true);
                        }}
                      >
                        Add Members
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Members</h4>
                    <div className="space-y-2">
                      {group.members.slice(0, 3).map((member) => (
                        <div
                          key={member.uid}
                          className="text-sm text-gray-600 flex items-center"
                        >
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2">
                            {member.displayName[0].toUpperCase()}
                          </div>
                          <span>{member.displayName}</span>
                          {member.uid === group.createdBy && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Lecturer</span>
                          )}
                        </div>
                      ))}
                      {group.members.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{group.members.length - 3} more members
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Edit Group Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateGroup} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter group description"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                />
              </div>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Members Dialog */}
        <Dialog open={isAddMembersOpen} onOpenChange={setIsAddMembersOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Members</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <UserAutocomplete
                selectedUsers={newMembers}
                onSelect={setNewMembers}
                placeholder="Search users by email or username"
              />
              <Button
                className="w-full"
                onClick={handleAddMembers}
                disabled={newMembers.length === 0}
              >
                Add Selected Members
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Layout>
    </AnimationWrapper>
  );
}
