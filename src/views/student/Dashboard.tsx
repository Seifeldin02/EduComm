import Layout from "@/components/layout/Layout";
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect } from "react";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { 
  BookOpen, 
  Calendar, 
  MessageCircle, 
  Users,
  ArrowRight
} from 'react-feather';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface GroupSummary {
  id: string;
  name: string;
  memberCount: number;
}

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [recentMessages, setRecentMessages] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Fetch groups
        const token = await user.getIdToken();
        const groupsResponse = await fetch("http://localhost:3000/api/groups", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!groupsResponse.ok) {
          throw new Error("Failed to fetch groups");
        }
        
        const groupsData = await groupsResponse.json();
        const groupsList = groupsData.groups || [];
        
        // Transform groups data
        const groupsSummary = groupsList.map((group: any) => ({
          id: group.id,
          name: group.name,
          memberCount: group.members?.length || 0
        }));
        
        setGroups(groupsSummary);
        
        // For demo purposes, set a random number of recent messages
        setRecentMessages(Math.floor(Math.random() * 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: string | number, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );

  return (
    <AnimationWrapper>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {user?.displayName}!
              </h1>
              <p className="text-gray-500 mt-1">Here's your learning progress</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={BookOpen}
              title="Groups"
              value={groups.length}
              color="bg-blue-500"
            />
            <StatCard
              icon={Users}
              title="Total Members"
              value={groups.reduce((acc, group) => acc + group.memberCount, 0)}
              color="bg-green-500"
            />
            <StatCard
              icon={MessageCircle}
              title="Recent Messages"
              value={recentMessages}
              color="bg-purple-500"
            />
            <StatCard
              icon={Calendar}
              title="Profile"
              value="Manage"
              color="bg-orange-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks you can perform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => navigate("/student/groups")}
                  >
                    View Study Groups
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => navigate("/student/messages")}
                  >
                    Check Messages
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => navigate("/profile")}
                  >
                    Manage Profile
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Groups</CardTitle>
                <CardDescription>Groups you're a member of</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <p>You are not a member of any groups yet.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate("/student/groups")}
                    >
                      Browse Available Groups
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.slice(0, 5).map((group) => (
                      <div 
                        key={group.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/student/group-chat/${group.id}`)}
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{group.name}</h3>
                          <span className="text-sm text-gray-500">{group.memberCount} members</span>
                        </div>
                      </div>
                    ))}
                    {groups.length > 5 && (
                      <Button 
                        variant="link" 
                        className="w-full text-blue-500"
                        onClick={() => navigate("/student/groups")}
                      >
                        View all groups
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </AnimationWrapper>
  );
};

export default StudentDashboard;
