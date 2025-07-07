import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { registerWithEmail } from "@/firebase/auth";
import { API_CONFIG } from "@/config/api";
type RegisterFormProps = {
  role: "Student" | "Lecturer";
};

const createSchema = (role: "Student" | "Lecturer") =>
  z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must not exceed 20 characters")
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Username can only contain letters, numbers, and underscores"
        ),
      university: z.enum(["UTM"], {
        errorMap: () => ({ message: "Please choose a university" }),
      }),
      email: z
        .string()
        .email("Invalid email address")
        .refine(
          (val) =>
            role === "Student"
              ? val.endsWith("@graduate.utm.my")
              : val.endsWith("@utm.my"),
          {
            message:
              role === "Student"
                ? "Must end with @graduate.utm.my"
                : "Must end with @utm.my",
          }
        ),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(32, "Too long")
        .regex(
          /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/,
          "Must include one letter and one number"
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<ReturnType<typeof createSchema>>;

export default function RegisterForm({ role }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(createSchema(role)),
  });

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const universityValue = watch("university");
  const isUniversitySelected = !!universityValue;

  const emailPlaceholder =
    role === "Student" ? "example@graduate.utm.my" : "example@utm.my";

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const usernameCheckRes = await fetch(
        `${API_CONFIG.BASE_URL}/api/users/check-username?username=${data.username}`
      );

      if (usernameCheckRes.status === 409) {
        const error = await usernameCheckRes.json();
        setMessage({
          type: "error",
          text: error.message || "Username is taken",
        });
        return;
      }

      if (usernameCheckRes.status !== 200 && usernameCheckRes.status !== 304) {
        setMessage({
          type: "error",
          text: "Something went wrong checking the username",
        });
        return;
      }

      const { user, token } = await registerWithEmail(
        data.email,
        data.password,
        data.name
      );

      const res = await fetch(`${API_CONFIG.BASE_URL}/api/users/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: user.uid,
          username: data.username,
          role,
          email: data.email,
          fullName: data.name,
          university: data.university,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        setMessage({
          type: "error",
          text: error.message || "Something went wrong",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "✅ Registered successfully! Confirm your email to login.",
      });
    } catch (err: any) {
      setMessage({ type: "error", text: `❌ Error: ${err.message}` });
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Full Name */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          {...register("name")}
          placeholder="Your Full Name"
          className={`w-full px-8 py-3 border rounded-lg shadow-sm transition duration-150 bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300`}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          {...register("username")}
          placeholder="your_username"
          className={`w-full px-8 py-3 border rounded-lg shadow-sm transition duration-150 bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300`}
        />
        {errors.username && (
          <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
        )}
      </div>

      {/* University Selector */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          University
        </label>
        <select
          {...register("university")}
          className="w-full px-8 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-blue-300 focus:outline-none focus:ring-2"
        >
          <option value="">Select your university</option>
          <option value="UTM">Universiti Teknologi Malaysia (UTM)</option>
        </select>
        {errors.university && (
          <p className="text-sm text-red-500 mt-1">
            {errors.university.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder={isUniversitySelected ? emailPlaceholder : ""}
          disabled={!isUniversitySelected}
          className={`w-full px-8 py-3 border rounded-lg shadow-sm transition duration-150 ${
            isUniversitySelected
              ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          }`}
        />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          {...register("password")}
          type="password"
          disabled={!isUniversitySelected}
          className={`w-full px-8 py-3 border rounded-lg shadow-sm transition duration-150 ${
            isUniversitySelected
              ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          }`}
        />
        {errors.password && (
          <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          disabled={!isUniversitySelected}
          className={`w-full px-8 py-3 border rounded-lg shadow-sm transition duration-150 ${
            isUniversitySelected
              ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          }`}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      {/* Display Success or Error Message */}
      {message && (
        <div
          className={`p-4 rounded-lg text-center ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      {/* Submit Button */}
      <motion.div whileHover={{ scale: isUniversitySelected ? 1.03 : 1 }}>
        <Button
          type="submit"
          disabled={!isUniversitySelected}
          className={`w-full px-8 py-6 text-lg shadow-lg transition-all duration-200 ${
            isUniversitySelected
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Register
        </Button>
      </motion.div>
    </form>
  );
}
