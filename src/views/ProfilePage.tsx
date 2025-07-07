import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import Layout from "@/components/layout/Layout";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Lock, Mail, UserCheck } from "react-feather";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { API_CONFIG } from "@/config/api";
// Schema for profile form
const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
});

// Schema for password change form
const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, role } = useAuthStore();
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.displayName || "",
      username: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fetch username on component mount
  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch(
            `${API_CONFIG.BASE_URL}/api/users/get-username`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (res.ok) {
            const { username } = await res.json();
            profileForm.setValue("username", username);
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      }
    };

    fetchUsername();
  }, [user, profileForm]);

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setIsLoading(true);
    setProfileMessage(null);

    try {
      // Update username in backend
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/api/users/update-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (res.status === 409) {
        profileForm.setError("username", { message: "Username already taken" });
        setProfileMessage({ type: "error", text: "Username already taken" });
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        setProfileMessage({ type: "error", text: `Error: ${err.message}` });
        return;
      }

      // Update display name in Firebase Auth
      await updateProfile(user, {
        displayName: data.fullName,
      });

      // Update user in global state
      useAuthStore.getState().setUser({ ...user, displayName: data.fullName });

      setProfileMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user) return;

    setIsLoading(true);
    setPasswordMessage(null);

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        user.email!,
        data.currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, data.newPassword);

      // Reset form
      passwordForm.reset();

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully!",
      });
    } catch (err: any) {
      // Handle specific Firebase Auth errors
      if (err.code === "auth/wrong-password") {
        setPasswordMessage({
          type: "error",
          text: "Current password is incorrect",
        });
        passwordForm.setError("currentPassword", {
          message: "Current password is incorrect",
        });
      } else {
        setPasswordMessage({ type: "error", text: `Error: ${err.message}` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        {...profileForm.register("fullName")}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your full name"
                      />
                    </div>
                    {profileForm.formState.errors.fullName && (
                      <p className="text-sm text-red-500 mt-1">
                        {profileForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        {...profileForm.register("username")}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your username"
                      />
                    </div>
                    {profileForm.formState.errors.username && (
                      <p className="text-sm text-red-500 mt-1">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        value={user?.email || ""}
                        disabled
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Role
                    </label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        value={role || ""}
                        disabled
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 capitalize"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Updating..." : "Update Profile"}
                  </Button>

                  {profileMessage && (
                    <p
                      className={`text-sm ${
                        profileMessage.type === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {profileMessage.text}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        {...passwordForm.register("currentPassword")}
                        type="password"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your current password"
                      />
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        {...passwordForm.register("newPassword")}
                        type="password"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="New password"
                      />
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <input
                        {...passwordForm.register("confirmPassword")}
                        type="password"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? "Updating..." : "Change Password"}
                  </Button>

                  {passwordMessage && (
                    <p
                      className={`text-sm ${
                        passwordMessage.type === "success"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordMessage.text}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </AnimationWrapper>
  );
}
