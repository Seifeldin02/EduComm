import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  Plus,
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  Activity,
  BarChart,
} from "react-feather";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardStats {
  totalGroups: number;
  totalStudents: number;
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
        });

        // Create recent activity from groups
        const activities: RecentActivity[] = [];

        // Sort groups by creation date (newest first)
        const sortedGroups = [...groups].sort((a: any, b: any) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="container mx-auto px-4 py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex justify-between items-center"
              >
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {user?.displayName}
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Here's what's happening in your classes today
                  </p>
                  <div className="flex items-center mt-4 text-blue-100">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => navigate("/lecturer/groups")}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Group
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
            {/* Stats Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 -mt-8 relative z-10"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Groups
                    </CardTitle>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {stats.totalGroups}
                    </div>
                    <div className="flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">Active</span>
                      <span className="text-gray-500 ml-1">study groups</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Students
                    </CardTitle>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {stats.totalStudents}
                    </div>
                    <div className="flex items-center text-sm">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-yellow-500 font-medium">
                        Enrolled
                      </span>
                      <span className="text-gray-500 ml-1">students</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Main Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
            >
              {/* Quick Actions - Enhanced */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <Card className="bg-white shadow-lg border-0 h-full">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <BarChart className="w-5 h-5 mr-2" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Common tasks you can perform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-between h-12 border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                          onClick={() => navigate("/lecturer/groups")}
                        >
                          <div className="flex items-center">
                            <Users className="w-5 h-5 mr-3 text-blue-500" />
                            <span className="font-medium">
                              Manage Study Groups
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-between h-12 border-2 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                          onClick={() => navigate("/lecturer/messages")}
                        >
                          <div className="flex items-center">
                            <MessageSquare className="w-5 h-5 mr-3 text-green-500" />
                            <span className="font-medium">View Messages</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-between h-12 border-2 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                          onClick={() => navigate("/profile")}
                        >
                          <div className="flex items-center">
                            <Star className="w-5 h-5 mr-3 text-purple-500" />
                            <span className="font-medium">Edit Profile</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-between h-12 border-2 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
                          onClick={() => navigate("/lecturer/groups")}
                        >
                          <div className="flex items-center">
                            <Plus className="w-5 h-5 mr-3 text-orange-500" />
                            <span className="font-medium">
                              Create New Group
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity - Enhanced */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="bg-white shadow-lg border-0 h-full">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-green-100">
                      Latest updates from your groups
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"
                          />
                        </div>
                      ) : recentActivity.length === 0 ? (
                        <div className="text-center py-8">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          </motion.div>
                          <p className="text-gray-500 font-medium">
                            No recent activity
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Activities will appear here as you use the platform
                          </p>
                        </div>
                      ) : (
                        recentActivity.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-100"
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className={`
                                p-3 rounded-full shadow-md
                                ${
                                  activity.type === "join"
                                    ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                                    : ""
                                }
                                ${
                                  activity.type === "discussion"
                                    ? "bg-gradient-to-r from-purple-400 to-purple-500 text-white"
                                    : ""
                                }
                                ${
                                  activity.type === "event"
                                    ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white"
                                    : ""
                                }
                              `}
                            >
                              {activity.type === "join" && (
                                <Users className="w-5 h-5" />
                              )}
                              {activity.type === "discussion" && (
                                <MessageSquare className="w-5 h-5" />
                              )}
                              {activity.type === "event" && (
                                <Calendar className="w-5 h-5" />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 mb-1">
                                {activity.description}
                              </p>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {activity.timestamp}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Additional Info Section */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Platform Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-blue-100 text-sm">
                          Create study groups to organize your students by
                          subject or project
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-blue-100 text-sm">
                          Use the messaging system to communicate with students
                          directly
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-blue-100 text-sm">
                          Export activity reports to track student engagement
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <Star className="w-5 h-5 mr-2" />
                      Getting Started
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-green-100 text-sm">
                          Complete your profile to help students identify you
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-green-100 text-sm">
                          Set up your first study group and invite students
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-green-100 text-sm">
                          Explore the chat features for better communication
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
