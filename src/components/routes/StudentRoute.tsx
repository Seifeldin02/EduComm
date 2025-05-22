import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { JSX } from "react";

const StudentRoute = ({ children }: { children: JSX.Element }) => {
  const { user, role, isLoading } = useAuthStore();

  // Show nothing while loading
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If no user is logged in, redirect to the home page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If the user is a lecturer, redirect to the lecturer dashboard
  if (role === "Lecturer") {
    return <Navigate to="/lecturer/dashboard" replace />;
  }

  // If the user is a student, allow access to the route
  if (role === "Student") {
    return children;
  }

  // If the role is undefined or invalid, redirect to the home page
  return <Navigate to="/" replace />;
};

export default StudentRoute;
