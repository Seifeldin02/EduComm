import Layout from "@/components/layout/Layout";
import { useAuthStore } from "@/store/useAuthStore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Award, 
  Edit3, 
  MessageCircle, 
  FileText, 
  Users,
  Bell
} from 'react-feather';

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
});

type FormValues = z.infer<typeof schema>;

const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: string, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
    <Icon className="w-6 h-6 text-gray-600 mb-2" />
    <span className="text-sm font-medium text-gray-700">{title}</span>
  </button>
);

const StudentDashboard = () => {
  const { user, role } = useAuthStore();
  const [message, setMessage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.displayName ?? "",
      username: "",
    },
  });

  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const token = await user.getIdToken();
        const res = await fetch(
          "http://localhost:3000/api/users/get-username",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const { username } = await res.json();
          setValue("username", username);
        }
      }
    };

    fetchUsername();
  }, [user, setValue]);

  const onSubmit = async (data: FormValues) => {
    setMessage(null);

    try {
      const token = await user?.getIdToken();
      const res = await fetch(
        "http://localhost:3000/api/users/update-profile",
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
        setError("username", { message: "Username already taken" });
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        setMessage(`Error: ${err.message}`);
        return;
      }

      await updateProfile(user!, {
        displayName: data.fullName,
      });

      useAuthStore.getState().setUser({ ...user!, displayName: data.fullName });
      setMessage("✅ Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <AnimationWrapper>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome back, {user?.displayName}!
              </h1>
              <p className="text-gray-500 mt-1">Here's your learning progress</p>
            </div>
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={BookOpen}
              title="Courses Enrolled"
              value="4"
              color="bg-blue-500"
            />
            <StatCard
              icon={Clock}
              title="Hours Learned"
              value="26"
              color="bg-green-500"
            />
            <StatCard
              icon={Award}
              title="Certificates"
              value="2"
              color="bg-purple-500"
            />
            <StatCard
              icon={Calendar}
              title="Next Session"
              value="Today"
              color="bg-orange-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <QuickAction icon={BookOpen} title="My Courses" />
              <QuickAction icon={Calendar} title="Schedule" />
              <QuickAction icon={MessageCircle} title="Messages" />
              <QuickAction icon={FileText} title="Assignments" />
              <QuickAction icon={Users} title="Study Groups" />
              <QuickAction icon={Award} title="Certificates" />
            </div>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Profile Settings</h2>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Full Name
                  </label>
                  <input
                    {...register("fullName")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Username
                  </label>
                  <input
                    {...register("username")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>

                {message && (
                  <p className={`mt-2 text-sm ${message.includes('✅') ? 'text-green-500' : 'text-red-500'}`}>
                    {message}
                  </p>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-gray-800 font-medium">{user?.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800 font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="text-gray-800 font-medium capitalize">{role}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </AnimationWrapper>
  );
};

export default StudentDashboard;
