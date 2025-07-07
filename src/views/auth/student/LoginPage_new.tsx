import { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { API_CONFIG } from "@/config/api";
// Lightweight toast notification without external dependencies
const showToast = (message: string, type: "success" | "error" = "success") => {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white font-medium transition-all duration-300 transform ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  }`;
  toast.textContent = message;
  toast.style.transform = "translateX(100%)";
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
  });

  // Auto remove
  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
};

const LoginPage = memo(() => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    identifier: "",
    password: "",
    general: "",
  });

  // Optimized form validation
  const validateForm = useCallback(() => {
    const newErrors = { identifier: "", password: "", general: "" };

    if (!identifier.trim()) {
      newErrors.identifier = "Username or email is required";
    } else if (
      identifier.includes("@") &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    ) {
      newErrors.identifier = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return !newErrors.identifier && !newErrors.password;
  }, [identifier, password]);

  // Optimized login handler
  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({ identifier: "", password: "", general: "" });

    try {
      // Get email from identifier
      const res = await fetch(
        `${
          API_CONFIG.BASE_URL
        }/api/users/get-email?identifier=${encodeURIComponent(identifier)}`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (!res.ok) {
        throw new Error(
          res.status === 404 ? "User not found" : "Unable to verify user"
        );
      }

      const { email } = await res.json();

      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!userCredential.user.emailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      // Role verification
      const token = await userCredential.user.getIdToken();
      const verifyRes = await fetch(
        `${API_CONFIG.BASE_URL}/api/users/verify-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uid: userCredential.user.uid }),
        }
      );

      if (!verifyRes.ok) throw new Error("Role verification failed");

      const { role } = await verifyRes.json();

      if (role !== "student") {
        throw new Error("Access denied. This login is for students only.");
      }

      // Update auth store
      useAuthStore.getState().setUser(userCredential.user);
      useAuthStore.getState().setRole("Student");

      showToast("Login successful! Redirecting...", "success");
      navigate("/student/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setErrors({
        identifier: "",
        password: "",
        general: error.message || "Login failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [identifier, password, navigate, validateForm]);

  // Memoized event handlers
  const handleIdentifierChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIdentifier(e.target.value);
      if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: "" }));
    },
    [errors.identifier]
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
    },
    [errors.password]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) handleLogin();
    },
    [handleLogin, isLoading]
  );

  const handleSignUpClick = useCallback(
    () => navigate("/register/student"),
    [navigate]
  );
  const handleForgotPasswordClick = useCallback(
    () => navigate("/auth/forgot-password"),
    [navigate]
  );

  return (
    <div className="login-container">
      {/* SEO Content */}
      <div className="sr-only">
        <h1>EduComm Student Login</h1>
        <p>
          Sign in to your student account to access courses, assignments, and
          study groups.
        </p>
      </div>

      {/* Background decoration */}
      <div className="login-bg-blob" aria-hidden="true" />
      <div className="login-bg-blob" aria-hidden="true" />

      {/* Logo */}
      <img
        src="/EduCommLogo.png"
        alt="EduComm - Educational Communication Platform"
        className="login-logo"
        loading="eager"
        decoding="async"
        width="192"
        height="auto"
        fetchPriority="high"
      />

      {/* Page Title */}
      <h1 className="login-title">Student Login</h1>

      {/* Login Form */}
      <main className="login-form" role="main">
        {/* Error Display */}
        {errors.general && (
          <div
            className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            role="alert"
            aria-live="polite"
          >
            {errors.general}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          noValidate
          aria-label="Student login form"
        >
          {/* Username/Email Input */}
          <div className="mb-4">
            <label htmlFor="identifier" className="sr-only">
              Username or Email Address
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={handleIdentifierChange}
              onKeyPress={handleKeyPress}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
              aria-required="true"
              aria-invalid={!!errors.identifier}
              aria-describedby={
                errors.identifier ? "identifier-error" : undefined
              }
              className={`login-input ${
                errors.identifier ? "border-red-300 bg-red-50" : ""
              }`}
              disabled={isLoading}
            />
            {errors.identifier && (
              <p
                id="identifier-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.identifier}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onKeyPress={handleKeyPress}
              autoComplete="current-password"
              required
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`login-input ${
                errors.password ? "border-red-300 bg-red-50" : ""
              }`}
              disabled={isLoading}
            />
            {errors.password && (
              <p
                id="password-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            aria-describedby="login-status"
            className="login-button"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Status for screen readers */}
          <div
            id="login-status"
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {isLoading ? "Signing in, please wait..." : "Ready to sign in"}
          </div>
        </form>

        {/* Additional Links */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleForgotPasswordClick}
            className="text-sm text-green-600 hover:text-green-700 underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 rounded px-1"
            disabled={isLoading}
          >
            Forgot your password?
          </button>
        </div>

        <div className="mt-2 text-center">
          <span className="text-sm text-gray-600">Don't have an account? </span>
          <button
            type="button"
            onClick={handleSignUpClick}
            className="text-sm text-green-600 hover:text-green-700 underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 rounded px-1"
            disabled={isLoading}
          >
            Sign up
          </button>
        </div>
      </main>
    </div>
  );
});

LoginPage.displayName = "LoginPage";

export default LoginPage;
