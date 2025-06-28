import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { motion } from "framer-motion";
import { Users, BookOpen, MessageSquare, Calendar, Plus, ArrowRight } from "react-feather";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalGroups: number;
  totalStudents: number;
  activeDiscussions: number;
  upcomingEvents: number;
}

interface RecentActivity {
  id: string;
  type: "join" | "discussion" | "event";
  description: string;
  timestamp: string;
}

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalGroups: 0,
    totalStudents: 0,
    activeDiscussions: 0,
    upcomingEvents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

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
        const groups = groupsData.groups || [];
        
        // Calculate total students (unique students across all groups)
        const uniqueStudents = new Set();
        groups.forEach((group: any) => {
          group.members.forEach((member: any) => {
            if (member.uid !== user.uid) {
              uniqueStudents.add(member.uid);
            }
          });
        });
        
        // Update stats with real data
        setStats({
          totalGroups: groups.length,
          totalStudents: uniqueStudents.size,
          activeDiscussions: 0, // This would need a separate API call
          upcomingEvents: 0, // This would need a separate API call
        });
        
        // Create recent activity from groups
        const activities: RecentActivity[] = [];
        
        // Sort groups by creation date (newest first)
        const sortedGroups = [...groups].sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        // Take the 5 most recent groups
        sortedGroups.slice(0, 5).forEach((group: any) => {
          activities.push({
            id: group.id,
            type: "join",
            description: `Group "${group.name}" was created`,
            timestamp: new Date(group.createdAt).toLocaleString(),
          });
        });
        
        setRecentActivity(activities);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <AnimationWrapper>
    <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.displayName}</h1>
              <p className="text-gray-600 mt-1">Here's what's happening in your classes</p>
            </div>
            <Button
              onClick={() => navigate("/lecturer/groups")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Group
            </Button>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGroups}</div>
                  <p className="text-xs text-gray-500">Active study groups</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <BookOpen className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-gray-500">Enrolled students</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-gray-500">Check your messages</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profile</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-gray-500">Manage your profile</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants}>
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
                      onClick={() => navigate("/lecturer/groups")}
                    >
                      Manage Study Groups
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => navigate("/lecturer/messages")}
                    >
                      View Messages
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => navigate("/profile")}
                    >
                      Edit Profile
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates from your groups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                        />
                      </div>
                    ) : recentActivity.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    ) : (
                      recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-4 p-3 rounded-lg bg-gray-50"
                        >
                          <div className={`
                            p-2 rounded-full
                            ${activity.type === 'join' ? 'bg-green-100 text-green-600' : ''}
                            ${activity.type === 'discussion' ? 'bg-purple-100 text-purple-600' : ''}
                            ${activity.type === 'event' ? 'bg-orange-100 text-orange-600' : ''}
                          `}>
                            {activity.type === 'join' && <Users className="w-4 h-4" />}
                            {activity.type === 'discussion' && <MessageSquare className="w-4 h-4" />}
                            {activity.type === 'event' && <Calendar className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
      </div>
    </Layout>
    </AnimationWrapper>
  );
}
