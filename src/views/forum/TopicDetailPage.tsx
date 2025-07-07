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
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Edit2,
  Trash2,
  User,
  Calendar,
  ArrowLeft,
  Clock,
  MessageSquare,
  Send,
  Hash,
} from "react-feather";
import { toast } from "sonner";
import { CourseTopic, TopicReply } from "@/types/course";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { motion } from "framer-motion";
import { API_CONFIG } from "@/config/api";
const TopicDetailPage = ({
  userRole,
}: {
  userRole: "student" | "lecturer";
}) => {
  const { courseId, topicId } = useParams<{
    courseId: string;
    topicId: string;
  }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<CourseTopic | null>(null);
  const [replies, setReplies] = useState<TopicReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editReply, setEditReply] = useState<TopicReply | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (user && courseId && topicId) fetchTopic();
    // eslint-disable-next-line
  }, [user, courseId, topicId]);

  const fetchTopic = async () => {
    if (!user || !courseId || !topicId) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/courses/${courseId}/topics/${topicId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setTopic(data.topic || null);
        setReplies(data.replies || []);
      } else {
        setTopic(null);
        setReplies([]);
      }
    } catch (error) {
      setTopic(null);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId || !topicId) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/courses/${courseId}/topics/${topicId}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: replyContent }),
        }
      );
      if (res.ok) {
        toast.success("Reply posted!");
        setReplyContent("");
        fetchTopic();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to post reply");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to post reply"
      );
    }
  };

  const handleEditReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId || !topicId || !editReply) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/courses/${courseId}/topics/${topicId}/replies/${editReply.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: editContent }),
        }
      );
      if (res.ok) {
        toast.success("Reply updated!");
        setIsEditOpen(false);
        setEditReply(null);
        setEditContent("");
        fetchTopic();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update reply");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update reply"
      );
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user || !courseId || !topicId) return;
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/courses/${courseId}/topics/${topicId}/replies/${replyId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        toast.success("Reply deleted!");
        fetchTopic();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete reply");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete reply"
      );
    }
  };

  const canEditOrDeleteReply = (reply: TopicReply) => {
    if (!user) return false;
    if (userRole === "lecturer") return true;
    return reply.createdBy === user.uid;
  };

  if (loading) {
    return (
      <AnimationWrapper>
        <Layout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-6 py-12">
              <div className="flex justify-center items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
                />
              </div>
            </div>
          </div>
        </Layout>
      </AnimationWrapper>
    );
  }

  if (!topic) {
    return (
      <AnimationWrapper>
        <Layout>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-6 py-12">
              <div className="text-center max-w-md mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <MessageCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Topic Not Found
                </h2>
                <p className="text-gray-600 mb-6">
                  The topic you're looking for doesn't exist or has been
                  removed.
                </p>
                <Button
                  onClick={() => navigate(-1)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </Layout>
      </AnimationWrapper>
    );
  }

  return (
    <AnimationWrapper>
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <div className="container mx-auto px-6 py-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 p-2"
                  onClick={() =>
                    navigate(`/${userRole}/courses/${courseId}/topics`)
                  }
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold flex items-center gap-3">
                    <MessageCircle className="w-6 h-6" />
                    {topic.title}
                  </h1>
                  <div className="flex items-center gap-4 text-blue-100 mt-2">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span className="text-sm">By {topic.createdByName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">
                        {new Date(topic.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" />
                      <span className="text-sm">
                        {replies.length}{" "}
                        {replies.length === 1 ? "reply" : "replies"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-6">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Topic Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">
                          Topic Discussion
                        </h2>
                        <div className="prose max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {topic.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Replies Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Replies ({replies.length})
                  </h2>
                </div>

                {replies.length === 0 ? (
                  <Card className="bg-white shadow-lg border-0">
                    <CardContent className="p-8 text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No replies yet
                      </h3>
                      <p className="text-gray-500">
                        Be the first to join this discussion!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {replies.map((reply, index) => (
                      <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="group"
                      >
                        <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 text-sm">
                                    {reply.createdByName}
                                  </p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                      reply.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {canEditOrDeleteReply(reply) && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8"
                                    onClick={() => {
                                      setEditReply(reply);
                                      setEditContent(reply.content);
                                      setIsEditOpen(true);
                                    }}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-red-50 hover:text-red-600 h-8 w-8"
                                    onClick={() => handleDeleteReply(reply.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            <div className="ml-11 pl-4 border-l-2 border-gray-100">
                              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Add Reply Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-white shadow-lg border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Send className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Add Your Reply
                      </h3>
                    </div>

                    <form onSubmit={handleAddReply} className="space-y-3">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Share your thoughts, ask questions, or contribute to the discussion..."
                        required
                        className="min-h-[100px] text-sm border-2 border-gray-200 focus:border-blue-400 rounded-lg"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-2 text-sm font-medium"
                        >
                          <Send className="w-3 h-3 mr-2" />
                          Post Reply
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Edit Reply Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeaderUI>
                <DialogTitle className="text-2xl font-bold">
                  Edit Reply
                </DialogTitle>
              </DialogHeaderUI>
              <form onSubmit={handleEditReply} className="space-y-6 mt-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Your Reply
                  </label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Edit your reply..."
                    required
                    className="min-h-[150px] text-base border-2 border-gray-200 focus:border-blue-400"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                    className="px-8 h-12"
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

export default TopicDetailPage;
