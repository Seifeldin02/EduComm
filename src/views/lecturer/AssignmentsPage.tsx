import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import {
  Calendar,
  Clock,
  FileText,
  Users,
  Eye,
  Award,
  BookOpen,
  Edit,
  Plus,
  CheckCircle,
  ChevronRight,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Assignment } from "@/types/course";

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  assignments: Assignment[];
}

interface AssignmentWithCourse extends Assignment {
  courseName: string;
  courseCode: string;
  courseId: string;
  submissionCount: number;
  gradedCount: number;
}

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

export default function LecturerAssignmentsPage() {
  const [assignmentsByCourse, setAssignmentsByCourse] = useState<Course[]>([]);
  const [allAssignments, setAllAssignments] = useState<AssignmentWithCourse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grouped" | "all">("grouped");
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();

      // Fetch all assignments created by the lecturer
      const assignmentsResponse = await fetch(
        "http://localhost:3000/api/assignments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!assignmentsResponse.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const assignmentsData = await assignmentsResponse.json();
      const assignments = assignmentsData.assignments || [];

      // Group assignments by course
      const courseMap = new Map<string, Course>();
      const flatAssignments: AssignmentWithCourse[] = [];

      // Process each assignment
      for (const assignment of assignments) {
        try {
          // Fetch submission stats for each assignment
          const submissionsResponse = await fetch(
            `http://localhost:3000/api/assignments/${assignment.id}/submissions`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          let submissionCount = 0;
          let gradedCount = 0;

          if (submissionsResponse.ok) {
            const submissionsData = await submissionsResponse.json();
            const submissions = submissionsData.submissions || [];
            submissionCount = submissions.length;
            gradedCount = submissions.filter(
              (sub: any) => sub.grade !== undefined
            ).length;
          }

          // Create assignment with course info
          const assignmentWithCourse: AssignmentWithCourse = {
            ...assignment,
            courseName: assignment.courseName || "Unknown Course",
            courseCode: assignment.courseCode || assignment.courseId,
            courseId: assignment.courseId,
            submissionCount,
            gradedCount,
          };

          flatAssignments.push(assignmentWithCourse);

          // Group by course
          const courseId = assignment.courseId;
          if (!courseMap.has(courseId)) {
            courseMap.set(courseId, {
              id: courseId,
              name: assignment.courseName || "Unknown Course",
              code: assignment.courseCode || courseId,
              description: "",
              assignments: [],
            });
          }

          courseMap.get(courseId)!.assignments.push(assignment);
        } catch (error) {
          console.error(
            `Error fetching submissions for assignment ${assignment.id}:`,
            error
          );

          // Add assignment without submission stats
          const assignmentWithCourse: AssignmentWithCourse = {
            ...assignment,
            courseName: assignment.courseName || "Unknown Course",
            courseCode: assignment.courseCode || assignment.courseId,
            courseId: assignment.courseId,
            submissionCount: 0,
            gradedCount: 0,
          };

          flatAssignments.push(assignmentWithCourse);

          // Group by course
          const courseId = assignment.courseId;
          if (!courseMap.has(courseId)) {
            courseMap.set(courseId, {
              id: courseId,
              name: assignment.courseName || "Unknown Course",
              code: assignment.courseCode || courseId,
              description: "",
              assignments: [],
            });
          }

          courseMap.get(courseId)!.assignments.push(assignment);
        }
      }

      setAssignmentsByCourse(Array.from(courseMap.values()));
      setAllAssignments(flatAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentStatusBadge = (assignment: AssignmentWithCourse) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    if (now > dueDate) {
      return {
        label: "Closed",
        color: "bg-red-100 text-red-800",
        icon: Clock,
      };
    } else {
      return {
        label: "Active",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      };
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Closed ${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const handleViewSubmissions = (courseId: string, assignmentId: string) => {
    navigate(
      `/lecturer/courses/${courseId}/assignments/${assignmentId}/submissions`
    );
  };

  const handleCreateAssignment = (courseId: string) => {
    navigate(`/lecturer/courses/${courseId}/assignments`);
  };

  const getTotalStats = () => {
    const totalAssignments = allAssignments.length;
    const totalSubmissions = allAssignments.reduce(
      (sum, assignment) => sum + assignment.submissionCount,
      0
    );
    const totalGraded = allAssignments.reduce(
      (sum, assignment) => sum + assignment.gradedCount,
      0
    );
    const activeAssignments = allAssignments.filter(
      (assignment) => new Date() <= new Date(assignment.dueDate)
    ).length;

    return {
      totalAssignments,
      totalSubmissions,
      totalGraded,
      activeAssignments,
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimationWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Assignments
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track all assignments across your courses
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grouped" ? "default" : "outline"}
                onClick={() => setViewMode("grouped")}
                size="sm"
              >
                <BookOpen size={16} className="mr-2" />
                By Course
              </Button>
              <Button
                variant={viewMode === "all" ? "default" : "outline"}
                onClick={() => setViewMode("all")}
                size="sm"
              >
                <FileText size={16} className="mr-2" />
                All Assignments
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <motion.div variants={cardVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Assignments
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalAssignments}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Assignments
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.activeAssignments}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Submissions
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.totalSubmissions}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Graded
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.totalGraded}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Assignments Content */}
          {viewMode === "grouped" ? (
            // Grouped by Course View
            <div className="space-y-6">
              {assignmentsByCourse.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No assignments found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You haven't created any assignments yet. Create your first
                      assignment to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                assignmentsByCourse.map((course) => (
                  <motion.div
                    key={course.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">
                              {course.name}
                            </CardTitle>
                            <CardDescription>{course.code}</CardDescription>
                          </div>
                          <Button
                            onClick={() => handleCreateAssignment(course.id)}
                            size="sm"
                          >
                            <Plus size={16} className="mr-2" />
                            Add Assignment
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {course.assignments.map((assignment) => {
                            const status = getAssignmentStatusBadge({
                              ...assignment,
                              courseName: course.name,
                              courseCode: course.code,
                              courseId: course.id,
                              submissionCount:
                                allAssignments.find(
                                  (a) => a.id === assignment.id
                                )?.submissionCount || 0,
                              gradedCount:
                                allAssignments.find(
                                  (a) => a.id === assignment.id
                                )?.gradedCount || 0,
                            });
                            const assignmentData = allAssignments.find(
                              (a) => a.id === assignment.id
                            );

                            return (
                              <div
                                key={assignment.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-medium text-gray-900">
                                      {assignment.title}
                                    </h4>
                                    <Badge className={status.color}>
                                      <status.icon size={12} className="mr-1" />
                                      {status.label}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      {getDaysUntilDue(assignment.dueDate)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users size={14} />
                                      {assignmentData?.submissionCount ||
                                        0}{" "}
                                      submissions
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Award size={14} />
                                      {assignmentData?.gradedCount || 0} graded
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <FileText size={14} />
                                      {assignment.maxPoints} points
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleViewSubmissions(
                                        course.id,
                                        assignment.id
                                      )
                                    }
                                  >
                                    <Eye size={16} className="mr-2" />
                                    View Submissions
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      navigate(
                                        `/lecturer/courses/${course.id}/assignments`
                                      )
                                    }
                                  >
                                    <ChevronRight size={16} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            // All Assignments View
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {allAssignments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No assignments found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You haven't created any assignments yet. Create your first
                      assignment to get started.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                allAssignments
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt || "").getTime() -
                      new Date(a.createdAt || "").getTime()
                  )
                  .map((assignment) => {
                    const status = getAssignmentStatusBadge(assignment);

                    return (
                      <motion.div
                        key={`${assignment.courseId}-${assignment.id}`}
                        variants={cardVariants}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {assignment.title}
                                  </h3>
                                  <Badge className={status.color}>
                                    <status.icon size={12} className="mr-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-blue-600 mb-2">
                                  {assignment.courseCode} -{" "}
                                  {assignment.courseName}
                                </p>
                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {getDaysUntilDue(assignment.dueDate)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users size={14} />
                                    {assignment.submissionCount} submissions
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Award size={14} />
                                    {assignment.gradedCount} graded
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText size={14} />
                                    {assignment.maxPoints} points
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleViewSubmissions(
                                      assignment.courseId,
                                      assignment.id
                                    )
                                  }
                                >
                                  <Eye size={16} className="mr-2" />
                                  View Submissions
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/lecturer/courses/${assignment.courseId}/assignments`
                                    )
                                  }
                                >
                                  <Edit size={16} className="mr-2" />
                                  Manage
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
              )}
            </motion.div>
          )}
        </div>
      </AnimationWrapper>
    </Layout>
  );
}
