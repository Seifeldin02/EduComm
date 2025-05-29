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
import GroupChatPage from './views/lecturer/GroupChatPage';
import StudentGroupChatPage from './views/student/GroupChatPage';
import StudentMessagesPage from '@/views/student/MessagesPage';
import LecturerMessagesPage from '@/views/lecturer/MessagesPage';
import DirectMessages from '@/components/chat/DirectMessages';
import { Toaster } from 'sonner';

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

          {/* Student-Specific Routes */}
          <Route
            path="/student/*"
            element={
              <StudentRoute>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="groups" element={<StudentGroupsPage />} />
                  <Route path="group-chat/:groupId" element={<StudentGroupChatPage />} />
                  <Route path="messages" element={<StudentMessagesPage />} />
                  <Route path="chat/:chatId" element={<DirectMessages />} />
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
                  <Route path="groups" element={<LecturerGroupsPage />} />
                  <Route path="group-chat/:groupId" element={<GroupChatPage />} />
                  <Route path="messages" element={<LecturerMessagesPage />} />
                  <Route path="chat/:chatId" element={<DirectMessages />} />
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
