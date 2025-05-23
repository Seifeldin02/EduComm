import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { JSX, useEffect } from "react";

const LecturerRoute = ({ children }: { children: JSX.Element }) => {
  const { user, role, isLoading } = useAuthStore();

  useEffect(() => {
    const verifyRole = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const res = await fetch("http://localhost:3000/api/users/verify-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ requiredRole: "Lecturer" }),
        });

        if (!res.ok) {
          console.error("Role verification failed:", await res.json());
        }
      } catch (error) {
        console.error("Error verifying role:", error);
      }
    };

    verifyRole();
  }, [user]);

  // Show nothing while loading
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If no user is logged in, redirect to the home page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If the user is a student, redirect to the student dashboard
  if (role === "Student") {
    return <Navigate to="/student/dashboard" replace />;
  }

  // If the user is a lecturer, allow access to the route
  if (role === "Lecturer") {
    return children;
  }

  // If the role is undefined or invalid, redirect to the home page
  return <Navigate to="/" replace />;
};

export default LecturerRoute;
