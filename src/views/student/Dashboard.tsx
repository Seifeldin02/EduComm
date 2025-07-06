import Layout from "@/components/layout/Layout";
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect } from "react";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  MessageSquare,
  Users,
  ChevronRight,
  Star,
  TrendingUp,
  Clock,
  Activity,
  BarChart,
} from "react-feather";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface GroupSummary {
  id: string;
  name: string;
  memberCount: number;
}

interface DashboardStats {
  totalGroups: number;
}

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalGroups: 0,
  });

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
          memberCount: group.members?.length || 0,
        }));

        setGroups(groupsSummary);

        // Update stats
        setStats({
          totalGroups: groupsList.length,
        });
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <div className="container mx-auto px-4 py-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex justify-between items-center"
              >
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {user?.displayName}!
                  </h1>
                  <p className="text-green-100 text-lg">
                    Continue your learning journey today
                  </p>
                  <div className="flex items-center mt-4 text-green-100">
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
                    onClick={() => navigate("/student/groups")}
                    size="lg"
                    className="bg-white text-green-600 hover:bg-green-50 shadow-lg"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    View Study Groups
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
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
                  <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <BarChart className="w-5 h-5 mr-2" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription className="text-green-100">
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
                          className="w-full justify-between h-12 border-2 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                          onClick={() => navigate("/student/groups")}
                        >
                          <div className="flex items-center">
                            <BookOpen className="w-5 h-5 mr-3 text-green-500" />
                            <span className="font-medium">
                              View Study Groups
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
                          className="w-full justify-between h-12 border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                          onClick={() => navigate("/student/messages")}
                        >
                          <div className="flex items-center">
                            <MessageSquare className="w-5 h-5 mr-3 text-blue-500" />
                            <span className="font-medium">Check Messages</span>
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
                            <span className="font-medium">Manage Profile</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Your Groups - Enhanced */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="bg-white shadow-lg border-0 h-full">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Your Study Groups
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Groups you're currently a member of
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
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
                    ) : groups.length === 0 ? (
                      <div className="text-center py-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        </motion.div>
                        <p className="text-gray-500 font-medium mb-2">
                          No groups yet
                        </p>
                        <p className="text-gray-400 text-sm mb-4">
                          Join study groups to start collaborating with other
                          students
                        </p>
                        <Button
                          onClick={() => navigate("/student/groups")}
                          className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
                        >
                          Browse Available Groups
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {groups.slice(0, 5).map((group, index) => (
                          <motion.div
                            key={group.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-100 cursor-pointer"
                            onClick={() =>
                              navigate(`/student/group-chat/${group.id}`)
                            }
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-lg">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-800">
                                    {group.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {group.memberCount} members
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </motion.div>
                        ))}
                        {groups.length > 5 && (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="text-center"
                          >
                            <Button
                              variant="ghost"
                              className="text-blue-500 hover:text-blue-600"
                              onClick={() => navigate("/student/groups")}
                            >
                              View all {groups.length} groups
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    )}
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
                <Card className="bg-gradient-to-br from-green-500 to-blue-600 text-white shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Study Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-green-100 text-sm">
                          Join study groups to collaborate with your classmates
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-green-100 text-sm">
                          Use the messaging system to ask questions and get help
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-green-100 text-sm">
                          Stay active in group discussions to enhance your
                          learning
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg border-0">
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
                        <p className="text-purple-100 text-sm">
                          Complete your profile to connect with other students
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-purple-100 text-sm">
                          Browse and join study groups that match your interests
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-purple-100 text-sm">
                          Start participating in group chats and discussions
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
};

export default StudentDashboard;
