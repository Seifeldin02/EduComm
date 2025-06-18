import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { 
  FileText, 
  Plus, 
  Download, 
  Edit2, 
  Trash2, 
  Eye,
  ArrowLeft,
  File,
  Image as ImageIcon
} from "react-feather";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CourseMaterial } from "@/types/course";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from '@/components/chat/FileUpload';

interface CourseMaterialsPageProps {
  userRole: 'student' | 'lecturer';
}

export default function CourseMaterialsPage({ userRole }: CourseMaterialsPageProps) {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [courseName, setCourseName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [file, setFile] = useState<any>(null);

  useEffect(() => {
    if (user && courseId) {
      fetchMaterials();
      fetchCourseInfo();
    }
  }, [user, courseId]);

  const fetchCourseInfo = async () => {
    if (!user || !courseId) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCourseName(data.course.name);
      }
    } catch (error) {
      console.error('Error fetching course info:', error);
    }
  };

  const fetchMaterials = async () => {
    if (!user || !courseId) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/materials`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials || []);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error("Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId) return;

    try {
      const token = await user.getIdToken();
      const body: any = { title, description, isVisible };
      if (file) body.fileAttachment = file;
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/materials`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Material created successfully!");
        setIsCreateOpen(false);
        setTitle("");
        setDescription("");
        setIsVisible(true);
        setFile(null);
        fetchMaterials();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create material');
      }
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create material");
    }
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !user || !courseId) return;

    try {
      const token = await user.getIdToken();
      const body: any = { 
        materialId: selectedMaterial.id,
        title, 
        description, 
        isVisible 
      };
      if (file) body.fileAttachment = file;
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/materials`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Material updated successfully!");
        setIsEditOpen(false);
        setFile(null);
        fetchMaterials();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update material');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update material");
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}/materials`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ materialId }),
      });

      if (res.ok) {
        toast.success("Material deleted successfully!");
        fetchMaterials();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to delete material");
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(`http://localhost:3000${url}`);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (mimetype: string, isImage: boolean) => {
    if (isImage) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (mimetype?.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <AnimationWrapper>
        <Layout>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </Layout>
      </AnimationWrapper>
    );
  }

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/${userRole}/courses/${courseId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Course
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Course Materials</h1>
                <p className="text-gray-600">{courseName}</p>
              </div>
            </div>
            
            {userRole === 'lecturer' && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Material
              </Button>
            )}
          </div>

          {/* Materials List */}
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No materials yet</h3>
              <p className="text-gray-500">
                {userRole === 'lecturer' 
                  ? 'Start by adding some course materials for your students.'
                  : 'No materials have been uploaded for this course yet.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            {material.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={material.isVisible ? "default" : "secondary"}>
                              {material.isVisible ? "Visible" : "Hidden"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(material.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {userRole === 'lecturer' && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMaterial(material);
                                setTitle(material.title);
                                setDescription(material.description);
                                setIsVisible(material.isVisible);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMaterial(material.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <CardDescription className="mb-4">
                        {material.description}
                      </CardDescription>
                      
                      {material.fileAttachment && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <div className="flex items-center gap-3">
                            {getFileIcon(material.fileAttachment.mimetype, material.fileAttachment.isImage)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {material.fileAttachment.originalName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(material.fileAttachment.size)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(
                                material.fileAttachment!.url, 
                                material.fileAttachment!.originalName
                              )}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Updated: {new Date(material.updatedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Create Material Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Course Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMaterial} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter material title"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter material description"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isVisible"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isVisible" className="text-sm">
                  Make visible to students
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">File Attachment</label>
                <FileUpload onFileUploaded={setFile} />
                {file && (
                  <div className="text-xs text-green-600">{file.originalName} uploaded</div>
                )}
              </div>
              <Button type="submit" className="w-full">
                Add Material
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Material Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateMaterial} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter material title"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter material description"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsVisible"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="editIsVisible" className="text-sm">
                  Make visible to students
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">File Attachment</label>
                <FileUpload onFileUploaded={setFile} />
                {file && (
                  <div className="text-xs text-green-600">{file.originalName} uploaded</div>
                )}
              </div>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </Layout>
    </AnimationWrapper>
  );
} 