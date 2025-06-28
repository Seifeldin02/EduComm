import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useFirebaseAuthListener } from "@/hooks/useAuthListener";
import Welcome from "@/views/welcome/WelcomePage";
import RoleSelector from "@/views/register/RoleSelector";
import StudentRegisterPage from "@/views/register/student/RegisterPage";
import LecturerRegisterPage from "@/views/register/lecturer/RegisterPage";
import StudentLoginPage from "@/views/auth/student/LoginPage";
import LecturerLoginPage from "@/views/auth/lecturer/LoginPage";
import PublicRoute from "./components/routes/PublicRoute";
import StudentRoute from "./components/routes/StudentRoute";
import LecturerRoute from "./components/routes/LecturerRoute";
import StudentDashboard from "@/views/student/Dashboard";
import LecturerDashboard from "@/views/lecturer/Dashboard";
import DevAuthDebugger from "@/components/dev/DevAuthDebugger";
import StudentGroupsPage from "@/views/student/GroupsPage";
import LecturerGroupsPage from "@/views/lecturer/GroupsPage";
import GroupChatPage from "./views/lecturer/GroupChatPage";
import StudentGroupChatPage from "./views/student/GroupChatPage";
import StudentMessagesPage from "@/views/student/MessagesPage";
import LecturerMessagesPage from "@/views/lecturer/MessagesPage";
import DirectMessages from "@/components/chat/DirectMessages";
import StudentCoursesPage from "@/views/student/CoursesPage";
import StudentAssignmentsPage from "@/views/student/AssignmentsPage";
import LecturerCoursesPage from "@/views/lecturer/CoursesPage";
import CourseDetailPage from "@/components/course/CourseDetailPage";
import CourseManagePage from "@/views/lecturer/CourseManagePage";
import { Toaster } from "sonner";
import CourseMaterialsPage from "@/components/course/CourseMaterialsPage";
import CourseAssignmentsPage from "@/components/course/CourseAssignmentsPage";
import StudentAssignmentDetailPage from "@/views/student/StudentAssignmentDetailPage";
import LecturerAssignmentSubmissionsPage from "@/views/lecturer/LecturerAssignmentSubmissionsPage";
import LecturerAssignmentsPage from "@/views/lecturer/AssignmentsPage";
import CourseTopicsPage from "@/views/forum/CourseTopicsPage";
import TopicDetailPage from "@/views/forum/TopicDetailPage";
import StudentReportActivityPage from "@/views/student/ReportActivityPage";
import LecturerReportActivityPage from "@/views/lecturer/ReportActivityPage";
import ProfilePage from "@/views/ProfilePage";
import ProtectedRoute from "./components/routes/ProtectedRoute";

function App() {
  useFirebaseAuthListener();
  return (
    <>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Welcome />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RoleSelector />
              </PublicRoute>
            }
          />
          <Route
            path="/register/student"
            element={
              <PublicRoute>
                <StudentRegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register/lecturer"
            element={
              <PublicRoute>
                <LecturerRegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/student/login"
            element={
              <PublicRoute>
                <StudentLoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/lecturer/login"
            element={
              <PublicRoute>
                <LecturerLoginPage />
              </PublicRoute>
            }
          />

          {/* Common Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Student-Specific Routes */}
          <Route
            path="/student/*"
            element={
              <StudentRoute>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="courses" element={<StudentCoursesPage />} />
                  <Route
                    path="courses/:courseId"
                    element={<CourseDetailPage userRole="student" />}
                  />
                  <Route
                    path="courses/:courseId/materials"
                    element={<CourseMaterialsPage userRole="student" />}
                  />
                  <Route
                    path="assignments"
                    element={<StudentAssignmentsPage />}
                  />
                  <Route
                    path="assignments/:assignmentId"
                    element={<StudentAssignmentDetailPage />}
                  />
                  <Route path="groups" element={<StudentGroupsPage />} />
                  <Route
                    path="group-chat/:groupId"
                    element={<StudentGroupChatPage />}
                  />
                  <Route path="messages" element={<StudentMessagesPage />} />
                  <Route path="chat/:chatId" element={<DirectMessages />} />
                  <Route
                    path="courses/:courseId/topics"
                    element={<CourseTopicsPage userRole="student" />}
                  />
                  <Route
                    path="courses/:courseId/topics/:topicId"
                    element={<TopicDetailPage userRole="student" />}
                  />
                  <Route
                    path="report-activity"
                    element={<StudentReportActivityPage />}
                  />
                </Routes>
              </StudentRoute>
            }
          />

          {/* Lecturer-Specific Routes */}
          <Route
            path="/lecturer/*"
            element={
              <LecturerRoute>
                <Routes>
                  <Route path="dashboard" element={<LecturerDashboard />} />
                  <Route path="courses" element={<LecturerCoursesPage />} />
                  <Route
                    path="courses/:courseId"
                    element={<CourseDetailPage userRole="lecturer" />}
                  />
                  <Route
                    path="courses/:courseId/manage"
                    element={<CourseManagePage />}
                  />
                  <Route
                    path="courses/:courseId/materials"
                    element={<CourseMaterialsPage userRole="lecturer" />}
                  />
                  <Route
                    path="courses/:courseId/assignments"
                    element={<CourseAssignmentsPage />}
                  />
                  <Route
                    path="courses/:courseId/assignments/:assignmentId/submissions"
                    element={<LecturerAssignmentSubmissionsPage />}
                  />
                  <Route path="groups" element={<LecturerGroupsPage />} />
                  <Route path="assignments" element={<LecturerAssignmentsPage />} />
                  <Route
                    path="group-chat/:groupId"
                    element={<GroupChatPage />}
                  />
                  <Route path="messages" element={<LecturerMessagesPage />} />
                  <Route path="chat/:chatId" element={<DirectMessages />} />
                  <Route
                    path="courses/:courseId/topics"
                    element={<CourseTopicsPage userRole="lecturer" />}
                  />
                  <Route
                    path="courses/:courseId/topics/:topicId"
                    element={<TopicDetailPage userRole="lecturer" />}
                  />
                  <Route
                    path="report-activity"
                    element={<LecturerReportActivityPage />}
                  />
                </Routes>
              </LecturerRoute>
            }
          />

          {/* Catch-All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <DevAuthDebugger />
    </>
  );
}

export default App;
