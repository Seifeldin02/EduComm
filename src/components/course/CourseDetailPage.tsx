import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  Plus,
  Settings,
  Award,
  User,
} from "react-feather";
import { API_CONFIG } from "@/config/api";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Course, CourseMaterial, Assignment } from "@/types/course";

interface CourseDetailPageProps {
  userRole: "student" | "lecturer";
}

export default function CourseDetailPage({ userRole }: CourseDetailPageProps) {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && courseId) {
      fetchCourseData();
    }
  }, [user, courseId]);

  const fetchCourseData = async () => {
    if (!user || !courseId) return;

    try {
      const token = await user.getIdToken();

      // Fetch course details
      const courseRes = await fetch(
        `${API_CONFIG.BASE_URL}/api/courses/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!courseRes.ok) {
        throw new Error("Failed to fetch course details");
      }

      const courseData = await courseRes.json();
      setCourse(courseData.course);

      // Fetch materials
      try {
        const materialsRes = await fetch(
          `${API_CONFIG.BASE_URL}/api/courses/${courseId}/materials`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setMaterials(materialsData.materials || []);
        } else {
          console.warn("Failed to fetch materials");
          setMaterials([]);
        }
      } catch (error) {
        console.warn("Error fetching materials:", error);
        setMaterials([]);
      }

      // Fetch assignments - get all assignments and filter by courseId
      try {
        const assignmentsRes = await fetch(
          `${API_CONFIG.BASE_URL}/api/assignments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json();
          // Filter assignments for this specific course
          const courseAssignments = (assignmentsData.assignments || []).filter(
            (assignment: Assignment) => assignment.courseId === courseId
          );
          setAssignments(courseAssignments);
        } else {
          console.warn("Failed to fetch assignments");
          setAssignments([]);
        }
      } catch (error) {
        console.warn("Error fetching assignments:", error);
        setAssignments([]);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMaterials = () => {
    navigate(`/${userRole}/courses/${courseId}/materials`);
  };

  const handleViewAssignments = () => {
    if (userRole === "student") {
      navigate(`/student/assignments?course=${courseId}`);
    } else {
      navigate(`/lecturer/courses/${courseId}/assignments`);
    }
  };

  const handleManageCourse = () => {
    navigate(`/${userRole}/courses/${courseId}/manage`);
  };

  const handleViewTopics = () => {
    navigate(`/${userRole}/courses/${courseId}/topics`);
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

  if (!course) {
    return (
      <AnimationWrapper>
        <Layout>
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-800">
              Course not found
            </h2>
            <p className="text-gray-600 mt-2">
              The course you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Button
              className="mt-4"
              onClick={() => navigate(`/${userRole}/courses`)}
            >
              Back to Courses
            </Button>
          </div>
        </Layout>
      </AnimationWrapper>
    );
  }

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Course Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                  <h1 className="text-3xl font-bold text-gray-800">
                    {course.name}
                  </h1>
                  {course.courseCode && (
                    <Badge variant="outline">{course.courseCode}</Badge>
                  )}
                </div>
                <p className="text-gray-600 text-lg mb-4">
                  {course.description}
                </p>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.studentsInfo?.length || 0} students
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created {new Date(course.createdAt).toLocaleDateString()}
                  </div>
                  {course.lecturerName && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {course.lecturerName}
                    </div>
                  )}
                </div>
              </div>

              {userRole === "lecturer" && course.isLecturer && (
                <Button
                  variant="outline"
                  onClick={handleManageCourse}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Manage Course
                </Button>
              )}
            </div>
          </motion.div>
          {/* Course Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Materials */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Course Materials
                    </CardTitle>
                    {userRole === "lecturer" && course.isLecturer && (
                      <Button
                        size="sm"
                        onClick={handleViewMaterials}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Material
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Resources and materials for this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {materials.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No materials uploaded yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {materials.slice(0, 3).map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-sm">
                                {material.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {material.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {material.fileAttachment ? "File" : "Text"}
                          </Badge>
                        </div>
                      ))}
                      {materials.length > 3 && (
                        <p className="text-sm text-gray-500 text-center pt-2">
                          +{materials.length - 3} more materials
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleViewMaterials}
                  >
                    View All Materials
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Assignments */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-500" />
                      Assignments
                    </CardTitle>
                    {userRole === "lecturer" && course.isLecturer && (
                      <Button
                        size="sm"
                        onClick={handleViewAssignments}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Create Assignment
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Assignments and assessments for this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No assignments created yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {assignments.slice(0, 3).map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Award className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-sm">
                                {assignment.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                Due:{" "}
                                {new Date(
                                  assignment.dueDate
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {assignment.maxPoints} pts
                          </Badge>
                        </div>
                      ))}
                      {assignments.length > 3 && (
                        <p className="text-sm text-gray-500 text-center pt-2">
                          +{assignments.length - 3} more assignments
                        </p>
                      )}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={handleViewAssignments}
                  >
                    View All Assignments
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>{" "}
          {/* Topics (Forum) Button */}
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="w-full max-w-xs"
              onClick={handleViewTopics}
            >
              Forum Topics
            </Button>
          </div>
          {/* Lecturer Actions */}
          {userRole === "lecturer" && course.isLecturer && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="default"
                className="w-full max-w-xs"
                onClick={() =>
                  navigate(`/lecturer/courses/${course.id}/manage`)
                }
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Course
              </Button>
            </div>
          )}
          {/* Students List (Lecturer Only) */}
          {userRole === "lecturer" &&
            course.isLecturer &&
            course.studentsInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      Enrolled Students ({course.studentsInfo.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {course.studentsInfo.map((student) => (
                        <div
                          key={student.uid}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
