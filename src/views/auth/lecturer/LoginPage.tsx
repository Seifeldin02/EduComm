import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      toast.error("Please enter both username/email and password");
      return;
    }

    setIsLoading(true);

    try {
      // Get email from backend
      const res = await fetch(
        `http://localhost:3000/api/users/get-email?identifier=${encodeURIComponent(
          identifier
        )}`
      );

      if (!res.ok) {
        throw new Error("User not found");
      }

      const { email } = await res.json();

      // Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      // Get ID token for backend role verification
      const token = await userCredential.user.getIdToken();

      // Verify role
      const verifyRes = await fetch(
        "http://localhost:3000/api/users/verify-role",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ requiredRole: "Lecturer" }),
        }
      );

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        // Sign out the user if role verification fails
        await auth.signOut();
        throw new Error(data.message || "Role verification failed");
      }

      // Extract data from response
      const { role } = await verifyRes.json();

      // Double-check role matches
      if (role.toLowerCase() !== "lecturer") {
        // Sign out the user if role doesn't match
        await auth.signOut();
        throw new Error("Invalid role for lecturer login");
      }

      useAuthStore.getState().setUser(userCredential.user);
      useAuthStore.getState().setRole(role);

      toast.success("Login successful!");
      navigate("/dashboard/lecturer");
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-tr from-sky-100 via-white to-green-100 flex flex-col justify-center items-center px-4">
      {/* Glowing Blobs */}
      <div className="absolute w-[400px] h-[400px] bg-blue-300 rounded-full blur-3xl opacity-30 top-[-100px] left-[-100px] animate-pulse" />
      <div className="absolute w-[300px] h-[300px] bg-green-300 rounded-full blur-3xl opacity-30 bottom-[-100px] right-[-100px] animate-pulse" />

      {/* Animated Logo */}
      <motion.img
        src="/EduCommLogo.png"
        alt="EduComm Logo"
        initial={{ opacity: 0, y: -40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-52 md:w-64 mb-8 drop-shadow-lg"
      />

      {/* Page Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-2xl md:text-3xl font-semibold text-gray-700 mb-10 text-center"
      >
        Lecturer Login
      </motion.h1>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
          <input
            placeholder="Username or Email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full mb-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
