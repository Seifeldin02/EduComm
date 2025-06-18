import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader as DialogHeaderUI, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Edit2, Trash2, User, Calendar, ArrowLeft } from 'react-feather';
import { toast } from 'sonner';
import { CourseTopic, TopicReply } from '@/types/course';
import Layout from '@/components/layout/Layout';
import { AnimationWrapper } from '@/components/AnimationWrapper';

const TopicDetailPage = ({ userRole }: { userRole: 'student' | 'lecturer' }) => {
  const { courseId, topicId } = useParams<{ courseId: string; topicId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<CourseTopic | null>(null);
  const [replies, setReplies] = useState<TopicReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editReply, setEditReply] = useState<TopicReply | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (user && courseId && topicId) fetchTopic();
    // eslint-disable-next-line
  }, [user, courseId, topicId]);

  const fetchTopic = async () => {
    if (!user || !courseId || !topicId) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/topics/${topicId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
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
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/topics/${topicId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyContent }),
      });
      if (res.ok) {
        toast.success('Reply posted!');
        setReplyContent('');
        fetchTopic();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post reply');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post reply');
    }
  };

  const handleEditReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId || !topicId || !editReply) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/topics/${topicId}/replies/${editReply.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        toast.success('Reply updated!');
        setIsEditOpen(false);
        setEditReply(null);
        setEditContent('');
        fetchTopic();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update reply');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update reply');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user || !courseId || !topicId) return;
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/topics/${topicId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success('Reply deleted!');
        fetchTopic();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete reply');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete reply');
    }
  };

  const canEditOrDeleteReply = (reply: TopicReply) => {
    if (!user) return false;
    if (userRole === 'lecturer') return true;
    return reply.createdBy === user.uid;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold text-gray-800">Topic not found</h2>
        <Button className="mt-4" onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button variant="ghost" className="mb-4 flex items-center gap-2" onClick={() => navigate(`/${userRole}/courses/${courseId}/topics`)}>
            <ArrowLeft className="w-4 h-4" /> Back to Topics
          </Button>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                {topic.title}
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                {topic.content}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" /> {topic.createdByName}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(topic.createdAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Replies Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Replies</h2>
            {replies.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No replies yet.</div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <Card key={reply.id} className="bg-gray-50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{reply.createdByName}</span>
                          <span className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        {canEditOrDeleteReply(reply) && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditReply(reply);
                                setEditContent(reply.content);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteReply(reply.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add Reply Form */}
          <form onSubmit={handleAddReply} className="space-y-4 mb-8">
            <Textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              required
            />
            <Button type="submit">Post Reply</Button>
          </form>

          {/* Edit Reply Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeaderUI>
                <DialogTitle>Edit Reply</DialogTitle>
              </DialogHeaderUI>
              <form onSubmit={handleEditReply} className="space-y-4 mt-4">
                <Textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Edit your reply"
                  required
                />
                <Button type="submit" className="w-full">Save Changes</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </AnimationWrapper>
  );
};

export default TopicDetailPage; 