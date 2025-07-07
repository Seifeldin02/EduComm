import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Award,
  ArrowLeft,
} from "react-feather";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { AddMembersModal } from "@/components/modals/AddMembersModal";
import { useNavigate } from "react-router-dom";
import { Course } from "@/types/course";
import { API_CONFIG } from "@/config/api";
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const listVariants = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      when: "afterChildren",
    },
  },
};

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch courses");
      }

      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, courseCode }),
      });

      if (res.ok) {
        toast.success("Course created successfully!");
        setIsCreateOpen(false);
        setName("");
        setDescription("");
        setCourseCode("");
        fetchCourses();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create course"
      );
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/courses/${selectedCourse.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description, courseCode }),
        }
      );

      if (res.ok) {
        toast.success("Course updated successfully!");
        setIsEditOpen(false);
        fetchCourses();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to update course");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this course? This action cannot be undone and will delete all associated materials and assignments."
      )
    )
      return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/courses/${courseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        toast.success("Course deleted successfully!");
        fetchCourses();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to delete course");
    }
  };

  const handleAddStudentsSuccess = () => {
    fetchCourses(); // Refresh the courses list
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/lecturer/courses/${courseId}`);
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/lecturer/dashboard")}
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
              <p className="text-gray-600 mt-1">
                Manage your courses and student enrollment
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Course</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCourse} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter course name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Course Code (optional)
                    </label>
                    <Input
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g., CS101"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter course description"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Course
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You haven't created any courses yet.
            </div>
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  variants={cardVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
                    <CardHeader
                      className="pb-4"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-500" />
                            {course.name}
                          </CardTitle>
                          {course.courseCode && (
                            <p className="text-sm text-gray-500 mt-1">
                              {course.courseCode}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourse(course);
                              setName(course.name);
                              setDescription(course.description);
                              setCourseCode(course.courseCode || "");
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCourse(course.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent
                      className="pt-0"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <CardDescription className="line-clamp-2 mb-4">
                        {course.description}
                      </CardDescription>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {course.studentCount || 0} students
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(course.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourse(course);
                              setIsAddStudentsOpen(true);
                            }}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Add Students
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/lecturer/courses/${course.id}/materials`
                              );
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Materials
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/lecturer/courses/${course.id}/assignments`
                              );
                            }}
                          >
                            <Award className="w-4 h-4 mr-1" />
                            Assignments
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/lecturer/courses/${course.id}/topics`);
                            }}
                          >
                            <BookOpen className="w-4 h-4 mr-1" />
                            Forum Topics
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Edit Course Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateCourse} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter course name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Code</label>
                <Input
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter course description"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Students Modal */}
        {selectedCourse && (
          <AddMembersModal
            isOpen={isAddStudentsOpen}
            onClose={() => setIsAddStudentsOpen(false)}
            onSuccess={handleAddStudentsSuccess}
            targetId={selectedCourse.id}
            targetType="course"
            title={`Add Students to ${selectedCourse.name}`}
          />
        )}
      </Layout>
    </AnimationWrapper>
  );
}
