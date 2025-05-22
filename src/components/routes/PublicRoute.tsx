import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isAuthReady } = useAuthStore();

  if (!isAuthReady) return null;

  if (user) {
    if (role === "Student") return <Navigate to="/student/dashboard" replace />;
    if (role === "Lecturer")
      return <Navigate to="/lecturer/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
