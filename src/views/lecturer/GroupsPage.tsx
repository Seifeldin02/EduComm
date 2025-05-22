// src/views/dashboard/CreateGroup.tsx
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { Plus, Edit2, Trash2 } from "react-feather";
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
            <h1 className="text-3xl font-bold">Groups</h1>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter group name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter group description"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
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
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleGroupClick(group.id)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <GroupAvatar
                          name={group.name}
                          imageUrl={group.imageUrl}
                          size="lg"
                        />
                        <div>
                          <h3 className="text-lg font-semibold">{group.name}</h3>
                          <p className="text-sm text-gray-500">
                            {group.members.length} members
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(group);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{group.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Edit Group Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter group name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter group description"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Update Group
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
              <form onSubmit={handleAddMembers} className="space-y-4">
                <UserAutocomplete
                  onSelect={(selectedUsers) => setNewMembers(selectedUsers)}
                  selectedUsers={newMembers}
                />
                <Button type="submit" className="w-full">
                  Add Members
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
