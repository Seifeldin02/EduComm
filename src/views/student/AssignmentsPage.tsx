import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Eye,
  Upload,
  Award,
  BookOpen,
  ArrowLeft
} from "react-feather";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Assignment } from "@/types/course";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const listVariants = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  hidden: {
    opacity: 0,
    transition: {
      when: "afterChildren"
    }
  }
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseFilter = searchParams.get('course');

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:3000/api/assignments", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch assignments');
      }

      const data = await res.json();
      let assignmentList = data.assignments || [];

      // Filter by course if specified
      if (courseFilter) {
        assignmentList = assignmentList.filter((assignment: Assignment) => 
          assignment.courseId === courseFilter
        );
      }

      setAssignments(assignmentList);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (assignment.userSubmission) {
      if (assignment.userSubmission.status === 'graded') {
        return {
          label: `Graded (${assignment.userSubmission.grade}/${assignment.maxPoints})`,
          color: 'bg-green-100 text-green-800',
          icon: Award
        };
      } else if (assignment.userSubmission.status === 'late') {
        return {
          label: 'Submitted Late',
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertCircle
        };
      } else {
        return {
          label: 'Submitted',
          color: 'bg-blue-100 text-blue-800',
          icon: CheckCircle
        };
      }
    } else if (now > dueDate) {
      return {
        label: 'Overdue',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      };
    } else {
      return {
        label: 'Pending',
        color: 'bg-gray-100 text-gray-800',
        icon: Clock
      };
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const handleViewAssignment = (assignmentId: string) => {
    navigate(`/student/assignments/${assignmentId}`);
  };

  const categorizeAssignments = () => {
    const now = new Date();
    
    const upcoming = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      return !a.userSubmission && dueDate > now;
    });

    const submitted = assignments.filter(a => a.userSubmission);
    
    const overdue = assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      return !a.userSubmission && dueDate <= now;
    });

    return { upcoming, submitted, overdue };
  };

  const { upcoming, submitted, overdue } = categorizeAssignments();

  const renderAssignmentCard = (assignment: Assignment) => {
    const status = getSubmissionStatus(assignment);
    const StatusIcon = status.icon;

    return (
      <motion.div
        key={assignment.id}
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200"
          onClick={() => handleViewAssignment(assignment.id)}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  {assignment.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {assignment.courseName}
                  </Badge>
                  <Badge className={`text-xs ${status.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <CardDescription className="line-clamp-2 mb-4">
              {assignment.description}
            </CardDescription>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(assignment.dueDate).toLocaleDateString()} at {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center text-gray-600">
                  <Award className="w-4 h-4 mr-1" />
                  {assignment.maxPoints} points
                </div>
              </div>

              <div className={`text-sm font-medium ${
                new Date(assignment.dueDate) <= new Date() && !assignment.userSubmission
                  ? 'text-red-600' 
                  : 'text-blue-600'
              }`}>
                {getDaysUntilDue(assignment.dueDate)}
              </div>

              {assignment.userSubmission?.grade !== undefined && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Grade</span>
                    <span className="text-lg font-bold text-green-600">
                      {assignment.userSubmission.grade}/{assignment.maxPoints}
                    </span>
                  </div>
                  {assignment.userSubmission.feedback && (
                    <p className="text-sm text-green-700 mt-2">
                      <span className="font-medium">Feedback:</span> {assignment.userSubmission.feedback}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewAssignment(assignment.id);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                {!assignment.userSubmission && new Date(assignment.dueDate) > new Date() && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewAssignment(assignment.id);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Submit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/student/courses')}
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Button>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">My Assignments</h1>
            <p className="text-gray-600 mt-1">
              {courseFilter ? 'Course assignments' : 'All assignments from your enrolled courses'}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No assignments</h3>
              <p className="text-gray-500">
                {courseFilter ? 'No assignments found for this course.' : 'No assignments have been created yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Assignments */}
              {upcoming.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Upcoming Assignments ({upcoming.length})
                  </h2>
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {upcoming.map(renderAssignmentCard)}
                  </motion.div>
                </div>
              )}

              {/* Overdue Assignments */}
              {overdue.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Overdue Assignments ({overdue.length})
                  </h2>
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {overdue.map(renderAssignmentCard)}
                  </motion.div>
                </div>
              )}

              {/* Submitted Assignments */}
              {submitted.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Submitted Assignments ({submitted.length})
                  </h2>
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {submitted.map(renderAssignmentCard)}
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </AnimationWrapper>
  );
} 