import { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useFirebaseAuthListener } from "@/hooks/useAuthListener";

// Lightweight loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
  </div>
);

// Critical routes - loaded immediately
import PublicRoute from "./components/routes/PublicRoute";
import StudentRoute from "./components/routes/StudentRoute";
import LecturerRoute from "./components/routes/LecturerRoute";
import ProtectedRoute from "./components/routes/ProtectedRoute";

// Lazy load all page components for better performance
const Welcome = lazy(() => import("@/views/welcome/WelcomePage"));
const RoleSelector = lazy(() => import("@/views/register/RoleSelector"));
const StudentRegisterPage = lazy(
  () => import("@/views/register/student/RegisterPage")
);
const LecturerRegisterPage = lazy(
  () => import("@/views/register/lecturer/RegisterPage")
);
const StudentLoginPage = lazy(() =>
  import("@/views/auth/student/LoginPage").then((module) => ({
    default: module.default,
  }))
);
const LecturerLoginPage = lazy(() =>
  import("@/views/auth/lecturer/LoginPage").then((module) => ({
    default: module.default,
  }))
);
const StudentDashboard = lazy(() => import("@/views/student/Dashboard"));
const LecturerDashboard = lazy(() => import("@/views/lecturer/Dashboard"));

// Lazy load secondary features
const StudentGroupsPage = lazy(() => import("@/views/student/GroupsPage"));
const LecturerGroupsPage = lazy(() => import("@/views/lecturer/GroupsPage"));
const GroupChatPage = lazy(() => import("./views/lecturer/GroupChatPage"));
const StudentGroupChatPage = lazy(
  () => import("./views/student/GroupChatPage")
);
const StudentMessagesPage = lazy(() => import("@/views/student/MessagesPage"));
const LecturerMessagesPage = lazy(
  () => import("@/views/lecturer/MessagesPage")
);
const DirectMessages = lazy(() => import("@/components/chat/DirectMessages"));
const StudentCoursesPage = lazy(() => import("@/views/student/CoursesPage"));
const StudentAssignmentsPage = lazy(
  () => import("@/views/student/AssignmentsPage")
);
const LecturerCoursesPage = lazy(() => import("@/views/lecturer/CoursesPage"));
const CourseDetailPage = lazy(
  () => import("@/components/course/CourseDetailPage")
);
const CourseManagePage = lazy(
  () => import("@/views/lecturer/CourseManagePage")
);
const CourseMaterialsPage = lazy(
  () => import("@/components/course/CourseMaterialsPage")
);
const CourseAssignmentsPage = lazy(
  () => import("@/components/course/CourseAssignmentsPage")
);
const StudentAssignmentDetailPage = lazy(
  () => import("@/views/student/StudentAssignmentDetailPage")
);
const LecturerAssignmentSubmissionsPage = lazy(
  () => import("@/views/lecturer/LecturerAssignmentSubmissionsPage")
);
const LecturerAssignmentsPage = lazy(
  () => import("@/views/lecturer/AssignmentsPage")
);
const CourseTopicsPage = lazy(() => import("@/views/forum/CourseTopicsPage"));
const TopicDetailPage = lazy(() => import("@/views/forum/TopicDetailPage"));
const StudentReportActivityPage = lazy(
  () => import("@/views/student/ReportActivityPage")
);
const LecturerReportActivityPage = lazy(
  () => import("@/views/lecturer/ReportActivityPage")
);
const ProfilePage = lazy(() => import("@/views/ProfilePage"));

// Lazy load development tools only in dev mode
const DevAuthDebugger =
  process.env.NODE_ENV === "development"
    ? lazy(() => import("@/components/dev/DevAuthDebugger"))
    : null;

// Lazy load toast system only when needed
const ToasterComponent = lazy(() =>
  import("sonner").then((module) => ({
    default: () => <module.Toaster position="top-right" />,
  }))
);

function App() {
  useFirebaseAuthListener();
  return (
    <Router>
      {/* Lazy load toaster only when needed */}
      <Suspense fallback={null}>
        <ToasterComponent />
      </Suspense>

      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <Welcome />
            </Suspense>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <RoleSelector />
              </Suspense>
            </PublicRoute>
          }
        />

        <Route
          path="/register/student"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <StudentRegisterPage />
              </Suspense>
            </PublicRoute>
          }
        />

        <Route
          path="/register/lecturer"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <LecturerRegisterPage />
              </Suspense>
            </PublicRoute>
          }
        />

        {/* Auth Routes */}
        <Route
          path="/student/login"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <StudentLoginPage />
              </Suspense>
            </PublicRoute>
          }
        />

        <Route
          path="/lecturer/login"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <LecturerLoginPage />
              </Suspense>
            </PublicRoute>
          }
        />

        {/* Common Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Student-Specific Routes with Lazy Loading */}
        <Route
          path="/student/*"
          element={
            <StudentRoute>
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
            </StudentRoute>
          }
        />

        {/* Lecturer-Specific Routes with Lazy Loading */}
        <Route
          path="/lecturer/*"
          element={
            <LecturerRoute>
              <Suspense fallback={<PageLoader />}>
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
                  <Route
                    path="assignments"
                    element={<LecturerAssignmentsPage />}
                  />
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
              </Suspense>
            </LecturerRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Development Tools - Only in development */}
      {process.env.NODE_ENV === "development" && DevAuthDebugger && (
        <Suspense fallback={null}>
          <DevAuthDebugger />
        </Suspense>
      )}
    </Router>
  );
}

export default App;
