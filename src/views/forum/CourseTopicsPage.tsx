import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader as DialogHeaderUI, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MessageCircle, Edit2, Trash2, User, Calendar, ArrowLeft } from 'react-feather';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { AnimationWrapper } from '@/components/AnimationWrapper';

import { CourseTopic } from '@/types/course';

const CourseTopicsPage = ({ userRole }: { userRole: 'student' | 'lecturer' }) => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<CourseTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<CourseTopic | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/topics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
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
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        toast.success('Topic created!');
        setIsCreateOpen(false);
        setTitle('');
        setContent('');
        await fetchTopics();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create topic');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create topic');
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
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/topics/${selectedTopic.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        toast.success('Topic updated!');
        setIsEditOpen(false);
        setSelectedTopic(null);
        setTitle('');
        setContent('');
        await fetchTopics();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update topic');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update topic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!user || !courseId) return;
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success('Topic deleted!');
        fetchTopics();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete topic');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete topic');
    }
  };

  const canEditOrDelete = (topic: CourseTopic) => {
    if (!user) return false;
    if (userRole === 'lecturer') return true;
    return topic.createdBy === user.uid;
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button
            variant="ghost"
            className="mb-6 flex items-center gap-2"
            onClick={() => navigate(`/${userRole}/courses/${courseId}`)}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Course
          </Button>
          <div className="sticky top-0 z-10 bg-white pb-4 mb-4 flex items-center justify-between border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-500" /> Forum Topics
            </h1>
            {userRole === 'lecturer' && (
              <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Topic
              </Button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <div className="font-semibold">No topics yet.</div>
              <div className="text-sm mt-1">Start a discussion for this course.</div>
            </div>
          ) : (
            <div className="space-y-6">
              {topics.map((topic) => (
                <Card key={topic.id} className="hover:shadow-lg cursor-pointer border border-gray-200 bg-white transition-all">
                  <CardHeader onClick={() => navigate(`./${topic.id}`)} className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        {topic.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {canEditOrDelete(topic) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedTopic(topic);
                                setTitle(topic.title);
                                setContent(topic.content);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteTopic(topic.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mt-2 text-gray-600 text-base">
                      {topic.content.length > 120 ? topic.content.slice(0, 120) + '...' : topic.content}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-6 text-xs text-gray-500 pt-2 pb-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {topic.createdByName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(topic.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Topic Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent>
              <DialogHeaderUI>
                <DialogTitle>New Forum Topic</DialogTitle>
              </DialogHeaderUI>
              <form onSubmit={handleCreateTopic} className="space-y-4 mt-4 relative">
                {submitting && (
                  <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter topic title"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Enter topic content"
                    required
                    disabled={submitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>Create Topic</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Topic Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeaderUI>
                <DialogTitle>Edit Forum Topic</DialogTitle>
              </DialogHeaderUI>
              <form onSubmit={handleEditTopic} className="space-y-4 mt-4 relative">
                {submitting && (
                  <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter topic title"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Enter topic content"
                    required
                    disabled={submitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>Save Changes</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </AnimationWrapper>
  );
};

export default CourseTopicsPage; 