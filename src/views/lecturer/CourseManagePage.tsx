import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Calendar,
  Edit2,
  Save,
  UserPlus,
  UserMinus,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AddMembersModal } from "@/components/modals/AddMembersModal";
import { Course } from "@/types/course";

interface Student {
  uid: string;
  email: string;
  name: string;
  enrolledAt: string;
}

export default function CourseManagePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");

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
        `http://localhost:3000/api/courses/${courseId}`,
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
      const courseInfo = courseData.course;
      setCourse(courseInfo);
      setName(courseInfo.name);
      setDescription(courseInfo.description);
      setCourseCode(courseInfo.courseCode || "");

      // Set students from course info (same as CourseDetailPage)
      setStudents(courseInfo.studentsInfo || []);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!course || !user) return;

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, courseCode }),
      });

      if (res.ok) {
        toast.success("Course updated successfully!");
        setIsEditing(false);
        fetchCourseData(); // Refresh data
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update course");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (
    studentId: string,
    studentName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to remove ${studentName} from this course?`
      )
    )
      return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch(
        `http://localhost:3000/api/courses/${courseId}/students`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ studentId }),
        }
      );

      if (res.ok) {
        toast.success(`${studentName} removed successfully!`);
        fetchCourseData(); // Refresh data
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove student");
      }
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Failed to remove student");
    }
  };

  const handleAddStudentsSuccess = () => {
    fetchCourseData(); // Refresh the course data
    toast.success("Students added successfully!");
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
              onClick={() => navigate("/lecturer/courses")}
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
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/lecturer/courses")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                Manage Course
              </h1>
              <p className="text-gray-600">
                Edit course details and manage enrolled students
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      Course Details
                    </CardTitle>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            setName(course.name);
                            setDescription(course.description);
                            setCourseCode(course.courseCode || "");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveCourse}
                          disabled={isSaving}
                          className="flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing ? (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Course Name
                        </label>
                        <p className="text-lg font-semibold">{course.name}</p>
                      </div>
                      {course.courseCode && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Course Code
                          </label>
                          <Badge variant="outline" className="ml-2">
                            {course.courseCode}
                          </Badge>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <p className="text-gray-600 mt-1">
                          {course.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Created{" "}
                          {new Date(course.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {students.length} enrolled
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Course Name
                        </label>
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
                        <label className="text-sm font-medium">
                          Description
                        </label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Enter course description"
                          required
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Student Management */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" />
                      Enrolled Students ({students.length})
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setIsAddStudentsOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Students
                    </Button>
                  </div>
                  <CardDescription>
                    Manage student enrollment for this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-700 mb-2">
                        No students enrolled
                      </h3>
                      <p className="text-sm">
                        Add students to get started with this course.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {students.map((student) => (
                        <div
                          key={student.uid}
                          className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {student.name[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {student.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {student.email}
                              </p>
                              <p className="text-xs text-gray-400">
                                Enrolled{" "}
                                {new Date(
                                  student.enrolledAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveStudent(student.uid, student.name)
                            }
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Add Students Modal */}
        {course && (
          <AddMembersModal
            isOpen={isAddStudentsOpen}
            onClose={() => setIsAddStudentsOpen(false)}
            onSuccess={handleAddStudentsSuccess}
            targetId={course.id}
            targetType="course"
            title={`Add Students to ${course.name}`}
          />
        )}
      </Layout>
    </AnimationWrapper>
  );
}
