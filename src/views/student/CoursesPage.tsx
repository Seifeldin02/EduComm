import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import {
  BookOpen,
  Calendar,
  Users,
  FileText,
  Award,
  ArrowLeft,
} from "react-feather";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

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

  const handleCourseClick = (courseId: string) => {
    navigate(`/student/courses/${courseId}`);
  };

  const handleViewMaterials = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/student/courses/${courseId}/materials`);
  };

  const handleViewAssignments = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/student/assignments?course=${courseId}`);
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/student/dashboard")}
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
            <p className="text-gray-600 mt-1">
              Access your enrolled courses and materials
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-500">
                You haven't been enrolled in any courses yet. Contact your
                lecturers to get enrolled.
              </p>
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
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all duration-200 h-full"
                    onClick={() => handleCourseClick(course.id)}
                  >
                    <CardHeader className="pb-4">
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
                        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Enrolled
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col">
                      <CardDescription className="line-clamp-2 mb-3 flex-grow text-sm">
                        {course.description}
                      </CardDescription>

                      <div className="space-y-2 mt-auto">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {course.studentCount || 0} students
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(course.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {course.lecturerName && (
                          <div className="text-xs text-gray-600 truncate">
                            <span className="font-medium">Lecturer:</span>{" "}
                            {course.lecturerName}
                          </div>
                        )}
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-1"
                              onClick={(e) => handleViewMaterials(course.id, e)}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Materials
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-1"
                              onClick={(e) =>
                                handleViewAssignments(course.id, e)
                              }
                            >
                              <Award className="w-3 h-3 mr-1" />
                              Assignments
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs py-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/student/courses/${course.id}/topics`);
                            }}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
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
      </Layout>
    </AnimationWrapper>
  );
}
