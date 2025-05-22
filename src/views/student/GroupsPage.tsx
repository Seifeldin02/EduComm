import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { toast } from "sonner";
import { GroupAvatar } from "@/components/ui/GroupAvatar";

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
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">My Study Groups</h1>

          {loading ? (
            <div className="text-center py-8">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You are not a member of any groups yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                    <GroupAvatar 
                      name={group.name} 
                      imageUrl={group.imageUrl} 
                      size="xl" 
                      className="w-32 h-32"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    <p className="text-gray-600 mt-1">{group.description}</p>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">
                        {group.members.length} members
                      </span>
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="border-t border-gray-200 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Members</h4>
                    <div className="space-y-2">
                      {group.members.map((member) => (
                        <div
                          key={member.uid}
                          className="text-sm text-gray-600"
                        >
                          {member.displayName}
                          {member.uid === group.createdBy && (
                            <span className="ml-2 text-xs text-blue-600">(Lecturer)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
            </div>
          ))}
            </div>
          )}
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
