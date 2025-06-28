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
} from "react-feather";
import { jsPDF } from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Extend jsPDF with autoTable property
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
    autoTable: typeof autoTable;
  }
}

interface StudentActivityStats {
  assignmentsAssigned: number;
  assignmentsSubmitted: number;
  averageAssignmentMark: number;
  groupsJoined: number;
  coursesEnrolled: number;
  topicsParticipatedIn: number;
  totalSubmissions: number;
  pendingAssignments: number;
  submissionRate: number;
}

interface AssignmentDetail {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  maxPoints: number;
  submittedGrade?: number;
  status: "submitted" | "pending" | "graded";
}

interface CourseDetail {
  id: string;
  name: string;
  courseCode: string;
  enrollmentDate: string;
  assignmentCount: number;
  topicCount: number;
}

interface GroupDetail {
  id: string;
  name: string;
  memberCount: number;
  joinDate: string;
  messageCount: number;
}

export default function StudentReportActivityPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentActivityStats>({
    assignmentsAssigned: 0,
    assignmentsSubmitted: 0,
    averageAssignmentMark: 0,
    groupsJoined: 0,
    coursesEnrolled: 0,
    topicsParticipatedIn: 0,
    totalSubmissions: 0,
    pendingAssignments: 0,
    submissionRate: 0,
  });
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [courses, setCourses] = useState<CourseDetail[]>([]);
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

      // Fetch assignments and submissions
      const assignmentsRes = await fetch(
        "http://localhost:3000/api/assignments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      let assignmentDetails: AssignmentDetail[] = [];
      let totalAssigned = 0;
      let totalSubmitted = 0;
      let totalGradePoints = 0;
      let gradedSubmissions = 0;

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        const userAssignments = assignmentsData.assignments || [];
        totalAssigned = userAssignments.length;

        // Check submissions for each assignment
        for (const assignment of userAssignments) {
          const submissionRes = await fetch(
            `http://localhost:3000/api/assignments/${assignment.id}/submissions`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          let submissionStatus: "submitted" | "pending" | "graded" = "pending";
          let grade: number | undefined;

          if (submissionRes.ok) {
            const submissionData = await submissionRes.json();
            const userSubmission = submissionData.submissions?.find(
              (s: any) => s.studentId === user.uid
            );

            if (userSubmission) {
              totalSubmitted++;
              submissionStatus =
                userSubmission.grade !== undefined ? "graded" : "submitted";
              if (userSubmission.grade !== undefined) {
                grade = userSubmission.grade;
                totalGradePoints += userSubmission.grade;
                gradedSubmissions++;
              }
            }
          }

          assignmentDetails.push({
            id: assignment.id,
            title: assignment.title,
            courseName: assignment.courseName || "Unknown Course",
            dueDate: assignment.dueDate,
            maxPoints: assignment.maxPoints || 100,
            submittedGrade: grade,
            status: submissionStatus,
          });
        }
      }

      // Fetch courses
      const coursesRes = await fetch("http://localhost:3000/api/courses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let courseDetails: CourseDetail[] = [];
      let totalTopicsParticipated = 0;

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const userCourses = coursesData.courses || [];

        for (const course of userCourses) {
          // Fetch topics for this course
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
            const topics = topicsData.topics || [];
            topicCount = topics.length;
            totalTopicsParticipated += topicCount;
          }

          const courseAssignments = assignmentDetails.filter(
            (a) => a.courseName === course.name
          );

          courseDetails.push({
            id: course.id,
            name: course.name,
            courseCode: course.courseCode || "",
            enrollmentDate: course.createdAt || new Date().toISOString(),
            assignmentCount: courseAssignments.length,
            topicCount: topicCount,
          });
        }
      }

      // Fetch groups
      const groupsRes = await fetch("http://localhost:3000/api/groups", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let groupDetails: GroupDetail[] = [];

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        const userGroups = groupsData.groups || [];

        groupDetails = userGroups.map((group: any) => ({
          id: group.id,
          name: group.name,
          memberCount: group.members?.length || 0,
          joinDate: group.createdAt || new Date().toISOString(),
          messageCount: 0, // This would need a separate API call to count messages
        }));
      }

      // Calculate stats
      const averageMark =
        gradedSubmissions > 0 ? totalGradePoints / gradedSubmissions : 0;
      const submissionRate =
        totalAssigned > 0 ? (totalSubmitted / totalAssigned) * 100 : 0;

      setStats({
        assignmentsAssigned: totalAssigned,
        assignmentsSubmitted: totalSubmitted,
        averageAssignmentMark: Math.round(averageMark * 10) / 10,
        groupsJoined: groupDetails.length,
        coursesEnrolled: courseDetails.length,
        topicsParticipatedIn: totalTopicsParticipated,
        totalSubmissions: totalSubmitted,
        pendingAssignments: totalAssigned - totalSubmitted,
        submissionRate: Math.round(submissionRate * 10) / 10,
      });

      setAssignments(assignmentDetails);
      setCourses(courseDetails);
      setGroups(groupDetails);
    } catch (error) {
      console.error("Error fetching activity data:", error);
      toast.error("Failed to fetch activity data");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("Student Activity Report", 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(
      `Student: ${user?.displayName || user?.email || "Unknown"}`,
      20,
      35
    );

    // Summary Statistics
    doc.setFontSize(14);
    doc.text("Activity Summary", 20, 50);

    const summaryData = [
      ["Metric", "Value"],
      ["Courses Enrolled", stats.coursesEnrolled.toString()],
      ["Groups Joined", stats.groupsJoined.toString()],
      ["Assignments Assigned", stats.assignmentsAssigned.toString()],
      ["Assignments Submitted", stats.assignmentsSubmitted.toString()],
      ["Average Assignment Mark", `${stats.averageAssignmentMark}%`],
      ["Submission Rate", `${stats.submissionRate}%`],
      ["Topics Participated In", stats.topicsParticipatedIn.toString()],
      ["Pending Assignments", stats.pendingAssignments.toString()],
    ];

    doc.autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 55,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Courses Section
    doc.setFontSize(14);
    doc.text("Enrolled Courses", 20, doc.lastAutoTable.finalY + 15);

    if (courses.length > 0) {
      const coursesData = courses.map((course) => [
        course.name,
        course.courseCode,
        course.assignmentCount.toString(),
        course.topicCount.toString(),
        new Date(course.enrollmentDate).toLocaleDateString(),
      ]);

      doc.autoTable({
        head: [
          ["Course Name", "Code", "Assignments", "Topics", "Enrolled Date"],
        ],
        body: coursesData,
        startY: doc.lastAutoTable.finalY + 20,
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94] },
      });
    }

    // Assignments Section
    doc.setFontSize(14);
    doc.text("Assignment Details", 20, doc.lastAutoTable.finalY + 15);

    if (assignments.length > 0) {
      const assignmentsData = assignments.map((assignment) => [
        assignment.title,
        assignment.courseName,
        assignment.status,
        assignment.submittedGrade
          ? `${assignment.submittedGrade}/${assignment.maxPoints}`
          : "Not graded",
        new Date(assignment.dueDate).toLocaleDateString(),
      ]);

      doc.autoTable({
        head: [["Assignment", "Course", "Status", "Grade", "Due Date"]],
        body: assignmentsData,
        startY: doc.lastAutoTable.finalY + 20,
        theme: "grid",
        headStyles: { fillColor: [168, 85, 247] },
      });
    }

    // Groups Section
    doc.setFontSize(14);
    doc.text("Group Memberships", 20, doc.lastAutoTable.finalY + 15);

    if (groups.length > 0) {
      const groupsData = groups.map((group) => [
        group.name,
        group.memberCount.toString(),
        new Date(group.joinDate).toLocaleDateString(),
      ]);

      doc.autoTable({
        head: [["Group Name", "Members", "Join Date"]],
        body: groupsData,
        startY: doc.lastAutoTable.finalY + 20,
        theme: "grid",
        headStyles: { fillColor: [245, 158, 11] },
      });
    }

    doc.save("student-activity-report.pdf");
    toast.success("PDF report generated successfully!");
  };

  if (loading) {
    return (
      <AnimationWrapper>
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
                onClick={() => navigate("/student/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Activity Report
                </h1>
                <p className="text-gray-600 mt-1">
                  Your comprehensive academic activity summary
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
                className="bg-blue-600 hover:bg-blue-700"
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
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Courses Enrolled
                      </p>
                      <p className="text-3xl font-bold text-blue-700">
                        {stats.coursesEnrolled}
                      </p>
                    </div>
                    <BookOpen className="w-8 h-8 text-blue-500" />
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
                        Assignments Submitted
                      </p>
                      <p className="text-3xl font-bold text-green-700">
                        {stats.assignmentsSubmitted}
                      </p>
                      <p className="text-xs text-green-600">
                        of {stats.assignmentsAssigned} assigned
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
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
                        Average Grade
                      </p>
                      <p className="text-3xl font-bold text-purple-700">
                        {stats.averageAssignmentMark}%
                      </p>
                      <p className="text-xs text-purple-600">
                        across graded assignments
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">
                        Groups Joined
                      </p>
                      <p className="text-3xl font-bold text-orange-700">
                        {stats.groupsJoined}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-orange-500" />
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
                    Submission Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.submissionRate}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {stats.pendingAssignments} assignments pending
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${stats.submissionRate}%` }}
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
                    Forum Participation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.topicsParticipatedIn}
                  </div>
                  <p className="text-sm text-gray-600">
                    topics participated in
                  </p>
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
                    <BarChart className="w-5 h-5 text-purple-500" />
                    Total Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.totalSubmissions}
                  </div>
                  <p className="text-sm text-gray-600">assignments submitted</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Assignments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Recent Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No assignments found
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
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                assignment.status === "graded"
                                  ? "bg-green-100 text-green-700"
                                  : assignment.status === "submitted"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {assignment.status}
                            </span>
                            {assignment.submittedGrade && (
                              <p className="text-sm text-gray-600 mt-1">
                                {assignment.submittedGrade}/
                                {assignment.maxPoints}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Course Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    Course Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No courses found
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-800">
                              {course.name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {course.courseCode}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mt-2">
                            <span>{course.assignmentCount} assignments</span>
                            <span>{course.topicCount} topics</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Group Memberships */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    Group Memberships
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groups.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No groups found
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
                              Joined:{" "}
                              {new Date(group.joinDate).toLocaleDateString()}
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
