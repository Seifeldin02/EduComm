import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Download,
  RefreshCw,
  Users,
  BookOpen,
  Award,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  FileText,
  BarChart,
  ArrowLeft,
  Calendar,
  Target,
} from "react-feather";
import { createPDFWithAutoTable } from "@/utils/pdfUtils";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface LecturerActivityStats {
  coursesCreated: number;
  assignmentsCreated: number;
  groupsCreated: number;
  topicsCreated: number;
  messagesSent: number;
  totalStudents: number;
  totalSubmissions: number;
  averageGradeGiven: number;
  submissionsGraded: number;
}

interface CourseDetail {
  id: string;
  name: string;
  courseCode: string;
  createdAt: string;
  studentsCount: number;
  assignmentsCount: number;
  topicsCount: number;
}

interface AssignmentDetail {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  maxPoints: number;
  submissionsCount: number;
  gradedCount: number;
  averageGrade: number;
}

interface GroupDetail {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  messageCount: number;
}

export default function LecturerReportActivityPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<LecturerActivityStats>({
    coursesCreated: 0,
    assignmentsCreated: 0,
    groupsCreated: 0,
    topicsCreated: 0,
    messagesSent: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    averageGradeGiven: 0,
    submissionsGraded: 0,
  });
  const [courses, setCourses] = useState<CourseDetail[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [groups, setGroups] = useState<GroupDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivityData();
    }
  }, [user]);

  const fetchActivityData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();

      // Fetch courses created by lecturer
      const coursesRes = await fetch("http://localhost:3000/api/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Fetch assignments created by lecturer
      const assignmentsRes = await fetch(
        "http://localhost:3000/api/assignments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Fetch groups created by lecturer
      const groupsRes = await fetch("http://localhost:3000/api/groups", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Fetch all submissions to get grading statistics
      const submissionsRes = await fetch(
        "http://localhost:3000/api/submissions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let courseDetails: CourseDetail[] = [];
      let assignmentDetails: AssignmentDetail[] = [];
      let groupDetails: GroupDetail[] = [];
      let totalStudents = 0;
      let totalTopics = 0;
      let totalSubmissions = 0;
      let totalGradePoints = 0;
      let gradedSubmissions = 0;
      let messagesSent = 0;

      // Process courses
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const lecturerCourses = (coursesData.courses || []).filter(
          (course: any) =>
            course.createdBy === user.uid || course.lecturerId === user.uid
        );

        for (const course of lecturerCourses) {
          // Get topics for this course
          const topicsRes = await fetch(
            `http://localhost:3000/api/courses/${course.id}/topics`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          let topicCount = 0;
          if (topicsRes.ok) {
            const topicsData = await topicsRes.json();
            topicCount = (topicsData.topics || []).length;
            totalTopics += topicCount;
          }

          const studentsCount = course.students?.length || 0;
          totalStudents += studentsCount;

          courseDetails.push({
            id: course.id,
            name: course.name,
            courseCode: course.courseCode || "",
            createdAt: course.createdAt || new Date().toISOString(),
            studentsCount: studentsCount,
            assignmentsCount: 0, // Will be calculated later
            topicsCount: topicCount,
          });
        }
      }

      // Process assignments
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        const lecturerAssignments = (assignmentsData.assignments || []).filter(
          (assignment: any) =>
            assignment.createdBy === user.uid ||
            assignment.lecturerId === user.uid
        );

        assignmentDetails = lecturerAssignments.map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          courseName: assignment.courseName || "Unknown Course",
          dueDate: assignment.dueDate,
          maxPoints: assignment.maxPoints || 100,
          submissionsCount: 0, // Will be calculated from submissions
          gradedCount: 0, // Will be calculated from submissions
          averageGrade: 0, // Will be calculated from submissions
        }));

        // Update course assignment counts
        courseDetails = courseDetails.map((course) => ({
          ...course,
          assignmentsCount: assignmentDetails.filter(
            (a) => a.courseName === course.name
          ).length,
        }));
      }

      // Process submissions and grading data
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        const allSubmissions = submissionsData.submissions || [];

        // Filter submissions for lecturer's assignments
        const lecturerSubmissions = allSubmissions.filter((submission: any) =>
          assignmentDetails.some(
            (assignment) => assignment.id === submission.assignmentId
          )
        );

        totalSubmissions = lecturerSubmissions.length;

        // Calculate grading statistics
        lecturerSubmissions.forEach((submission: any) => {
          if (
            submission.grade !== undefined &&
            submission.grade !== null &&
            submission.gradedBy === user.uid
          ) {
            totalGradePoints += submission.grade;
            gradedSubmissions++;
          }
        });

        // Update assignment statistics
        assignmentDetails = assignmentDetails.map((assignment) => {
          const assignmentSubmissions = lecturerSubmissions.filter(
            (s: any) => s.assignmentId === assignment.id
          );
          const gradedSubmissions = assignmentSubmissions.filter(
            (s: any) => s.grade !== undefined && s.grade !== null
          );
          const averageGrade =
            gradedSubmissions.length > 0
              ? gradedSubmissions.reduce(
                  (sum: number, s: any) => sum + s.grade,
                  0
                ) / gradedSubmissions.length
              : 0;

          return {
            ...assignment,
            submissionsCount: assignmentSubmissions.length,
            gradedCount: gradedSubmissions.length,
            averageGrade: Math.round(averageGrade * 10) / 10,
          };
        });
      }

      // Process groups
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        const lecturerGroups = (groupsData.groups || []).filter(
          (group: any) =>
            group.createdBy === user.uid || group.lecturerId === user.uid
        );

        groupDetails = lecturerGroups.map((group: any) => ({
          id: group.id,
          name: group.name,
          memberCount: group.members?.length || 0,
          createdAt: group.createdAt || new Date().toISOString(),
          messageCount: 0, // This would need message API to count properly
        }));
      }

      // Calculate final statistics
      const averageGradeGiven =
        gradedSubmissions > 0 ? totalGradePoints / gradedSubmissions : 0;

      setStats({
        coursesCreated: courseDetails.length,
        assignmentsCreated: assignmentDetails.length,
        groupsCreated: groupDetails.length,
        topicsCreated: totalTopics,
        messagesSent: messagesSent, // Would need message API
        totalStudents: totalStudents,
        totalSubmissions: totalSubmissions,
        averageGradeGiven: Math.round(averageGradeGiven * 10) / 10,
        submissionsGraded: gradedSubmissions,
      });

      setCourses(courseDetails);
      setAssignments(assignmentDetails);
      setGroups(groupDetails);
    } catch (error) {
      console.error("Error fetching activity data:", error);
      toast.error("Failed to fetch activity data");
    } finally {
      setLoading(false);
    }
  };
  const generatePDF = async () => {
    try {
      const doc = createPDFWithAutoTable();

      // Header
      doc.setFontSize(20);
      doc.text("Lecturer Activity Report", 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      doc.text(
        `Lecturer: ${user?.displayName || user?.email || "Unknown"}`,
        20,
        35
      );

      // Summary Statistics
      doc.setFontSize(14);
      doc.text("Teaching Activity Summary", 20, 50);

      const summaryData = [
        ["Metric", "Value"],
        ["Courses Created", stats.coursesCreated.toString()],
        ["Total Students Taught", stats.totalStudents.toString()],
        ["Assignments Created", stats.assignmentsCreated.toString()],
        ["Groups Created", stats.groupsCreated.toString()],
        ["Topics Created", stats.topicsCreated.toString()],
        ["Submissions Received", stats.totalSubmissions.toString()],
        ["Submissions Graded", stats.submissionsGraded.toString()],
        ["Average Grade Given", `${stats.averageGradeGiven}%`],
      ];
      doc.autoTable({
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: 55,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Courses Section
      doc.setFontSize(14);
      doc.text("Created Courses", 20, doc.lastAutoTable.finalY + 15);

      if (courses.length > 0) {
        const coursesData = courses.map((course) => [
          course.name,
          course.courseCode,
          course.studentsCount.toString(),
          course.assignmentsCount.toString(),
          course.topicsCount.toString(),
          new Date(course.createdAt).toLocaleDateString(),
        ]);
        doc.autoTable({
          head: [
            [
              "Course Name",
              "Code",
              "Students",
              "Assignments",
              "Topics",
              "Created Date",
            ],
          ],
          body: coursesData,
          startY: doc.lastAutoTable.finalY + 20,
          theme: "grid",
          headStyles: { fillColor: [34, 197, 94] },
        });
      }

      // Assignments Section
      doc.setFontSize(14);
      doc.text("Assignment Statistics", 20, doc.lastAutoTable.finalY + 15);

      if (assignments.length > 0) {
        const assignmentsData = assignments.map((assignment) => [
          assignment.title,
          assignment.courseName,
          assignment.submissionsCount.toString(),
          assignment.gradedCount.toString(),
          `${assignment.averageGrade}%`,
          new Date(assignment.dueDate).toLocaleDateString(),
        ]);
        doc.autoTable({
          head: [
            [
              "Assignment",
              "Course",
              "Submissions",
              "Graded",
              "Avg Grade",
              "Due Date",
            ],
          ],
          body: assignmentsData,
          startY: doc.lastAutoTable.finalY + 20,
          theme: "grid",
          headStyles: { fillColor: [168, 85, 247] },
        });
      }

      // Groups Section
      doc.setFontSize(14);
      doc.text("Created Groups", 20, doc.lastAutoTable.finalY + 15);

      if (groups.length > 0) {
        const groupsData = groups.map((group) => [
          group.name,
          group.memberCount.toString(),
          new Date(group.createdAt).toLocaleDateString(),
        ]);
        doc.autoTable({
          head: [["Group Name", "Members", "Created Date"]],
          body: groupsData,
          startY: doc.lastAutoTable.finalY + 20,
          theme: "grid",
          headStyles: { fillColor: [245, 158, 11] },
        });
      }

      doc.save("lecturer-activity-report.pdf");
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report. Please try again.");
    }
  };

  if (loading) {
    return (
      <AnimationWrapper>
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-2">Loading activity data...</span>
            </div>
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
                onClick={() => navigate("/lecturer/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Teaching Activity Report
                </h1>
                <p className="text-gray-600 mt-1">
                  Your comprehensive teaching activity summary
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchActivityData}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={generatePDF}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">
                        Courses Created
                      </p>
                      <p className="text-3xl font-bold text-indigo-700">
                        {stats.coursesCreated}
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Students Taught
                      </p>
                      <p className="text-3xl font-bold text-green-700">
                        {stats.totalStudents}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">
                        Assignments Created
                      </p>
                      <p className="text-3xl font-bold text-purple-700">
                        {stats.assignmentsCreated}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">
                        Average Grade Given
                      </p>
                      <p className="text-3xl font-bold text-amber-700">
                        {stats.averageGradeGiven}%
                      </p>
                      <p className="text-xs text-amber-600">
                        {stats.submissionsGraded} graded
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Submissions Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.totalSubmissions}
                  </div>
                  <p className="text-sm text-gray-600">
                    {stats.submissionsGraded} graded (
                    {Math.round(
                      (stats.submissionsGraded /
                        Math.max(stats.totalSubmissions, 1)) *
                        100
                    )}
                    %)
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round(
                          (stats.submissionsGraded /
                            Math.max(stats.totalSubmissions, 1)) *
                            100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    Forum Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.topicsCreated}
                  </div>
                  <p className="text-sm text-gray-600">topics created</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    Groups Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.groupsCreated}
                  </div>
                  <p className="text-sm text-gray-600">study groups</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Course Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    Course Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No courses created yet
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">
                              {course.name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {course.courseCode}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                            <span>{course.studentsCount} students</span>
                            <span>{course.assignmentsCount} assignments</span>
                            <span>{course.topicsCount} topics</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Assignment Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Assignment Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No assignments created yet
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {assignments.slice(0, 10).map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">
                              {assignment.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {assignment.courseName}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-800">
                              {assignment.gradedCount}/
                              {assignment.submissionsCount}
                            </div>
                            <div className="text-xs text-gray-600">
                              Avg: {assignment.averageGrade}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Group Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    Created Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groups.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No groups created yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800">
                              {group.name}
                            </h4>
                            <Users className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>{group.memberCount} members</p>
                            <p>
                              Created:{" "}
                              {new Date(group.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
