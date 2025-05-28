import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { toast } from "sonner";
import { GroupAvatar } from "@/components/ui/GroupAvatar";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "react-feather";
import { motion } from "framer-motion";

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

export default function StudentGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch groups');
      }

      const data = await res.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/student/group-chat/${groupId}`);
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">My Study Groups</h1>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You are not a member of any groups yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <motion.div
                  key={group.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGroupClick(group.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center group">
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
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                      {group.name}
                      <MessageCircle className="w-5 h-5 text-blue-500 opacity-75" />
                    </h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">{group.description}</p>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">
                        {group.members.length} members
                      </span>
                    </div>
                  </div>

                  {/* Members List */}
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
            </div>
          )}
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
