import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader as DialogHeaderUI,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  MessageCircle,
  Edit2,
  Trash2,
  User,
  ArrowLeft,
  Clock,
  Eye,
  MessageSquare,
  TrendingUp,
} from "react-feather";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { motion } from "framer-motion";

import { CourseTopic } from "@/types/course";

const CourseTopicsPage = ({
  userRole,
}: {
  userRole: "student" | "lecturer";
}) => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<CourseTopic | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && courseId) fetchTopics();
    // eslint-disable-next-line
  }, [user, courseId]);

  const fetchTopics = async () => {
    if (!user || !courseId) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `http://localhost:3000/api/courses/${courseId}/topics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics || []);
      } else {
        setTopics([]);
      }
    } catch (error) {
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `http://localhost:3000/api/courses/${courseId}/topics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, content }),
        }
      );
      if (res.ok) {
        toast.success("Topic created!");
        setIsCreateOpen(false);
        setTitle("");
        setContent("");
        await fetchTopics();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to create topic");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create topic"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId || !selectedTopic) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `http://localhost:3000/api/courses/${courseId}/topics/${selectedTopic.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, content }),
        }
      );
      if (res.ok) {
        toast.success("Topic updated!");
        setIsEditOpen(false);
        setSelectedTopic(null);
        setTitle("");
        setContent("");
        await fetchTopics();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update topic");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update topic"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!user || !courseId) return;
    if (!window.confirm("Are you sure you want to delete this topic?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `http://localhost:3000/api/courses/${courseId}/topics/${topicId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        toast.success("Topic deleted!");
        fetchTopics();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete topic");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete topic"
      );
    }
  };

  const canEditOrDelete = (topic: CourseTopic) => {
    if (!user) return false;
    if (userRole === "lecturer") return true;
    return topic.createdBy === user.uid;
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <div className="container mx-auto px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-2"
                    onClick={() => navigate(`/${userRole}/courses/${courseId}`)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                      <MessageCircle className="w-8 h-8" />
                      Course Forum
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Discuss, collaborate, and learn together
                    </p>
                  </div>
                </div>
                {userRole === "lecturer" && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setIsCreateOpen(true)}
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      New Topic
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : topics.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="bg-white rounded-2xl shadow-lg p-12 max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      No Topics Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Be the first to start a discussion in this course forum!
                    </p>
                    {userRole === "lecturer" && (
                      <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        Create First Topic
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1 }}
                  className="space-y-6"
                >
                  {/* Forum Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm font-medium">
                              Total Topics
                            </p>
                            <p className="text-3xl font-bold">
                              {topics.length}
                            </p>
                          </div>
                          <MessageSquare className="w-8 h-8 text-blue-200" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm font-medium">
                              Active Today
                            </p>
                            <p className="text-3xl font-bold">
                              {
                                topics.filter(
                                  (t) =>
                                    new Date(t.createdAt).toDateString() ===
                                    new Date().toDateString()
                                ).length
                              }
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-200" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm font-medium">
                              Contributors
                            </p>
                            <p className="text-3xl font-bold">
                              {new Set(topics.map((t) => t.createdBy)).size}
                            </p>
                          </div>
                          <User className="w-8 h-8 text-purple-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-4">
                    {topics.map((topic, index) => (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        className="group"
                      >
                        <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-md">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => navigate(`./${topic.id}`)}
                              >
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                                      {topic.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                      {topic.content.length > 150
                                        ? topic.content.slice(0, 150) + "..."
                                        : topic.content}
                                    </p>
                                  </div>
                                </div>

                                {/* Topic Meta */}
                                <div className="flex items-center gap-6 text-sm text-gray-500 mt-4">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span className="font-medium">
                                      {topic.createdByName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {new Date(
                                        topic.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    <span className="text-blue-500 hover:text-blue-600">
                                      Click to view discussion
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {canEditOrDelete(topic) && (
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-blue-50 hover:text-blue-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTopic(topic);
                                      setTitle(topic.title);
                                      setContent(topic.content);
                                      setIsEditOpen(true);
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-red-50 hover:text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTopic(topic.id);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Create Topic Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeaderUI>
                <DialogTitle className="text-2xl font-bold">
                  Create New Topic
                </DialogTitle>
              </DialogHeaderUI>
              <form onSubmit={handleCreateTopic} className="space-y-6 mt-6">
                {submitting && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 rounded-lg">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Topic Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter an engaging topic title..."
                    required
                    disabled={submitting}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Topic Content
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your thoughts, questions, or discussion points..."
                    required
                    disabled={submitting}
                    className="min-h-[150px] text-base"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    disabled={submitting}
                  >
                    {submitting ? "Creating..." : "Create Topic"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-8 h-12"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Topic Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeaderUI>
                <DialogTitle className="text-2xl font-bold">
                  Edit Topic
                </DialogTitle>
              </DialogHeaderUI>
              <form onSubmit={handleEditTopic} className="space-y-6 mt-6">
                {submitting && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 rounded-lg">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Topic Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter topic title..."
                    required
                    disabled={submitting}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Topic Content
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter topic content..."
                    required
                    disabled={submitting}
                    className="min-h-[150px] text-base"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                    className="px-8 h-12"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </AnimationWrapper>
  );
};

export default CourseTopicsPage;
