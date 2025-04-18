import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { registerWithEmail } from "@/firebase/auth";
const roles = ["Student", "Lecturer"] as const;
const onSubmit = async (data: RegisterFormValues) => {
  try {
    // Step 1: Check if the username is available
    const usernameCheckRes = await fetch(
      `http://localhost:3000/api/users/check-username?username=${data.username}`
    );
    if (usernameCheckRes.status === 409) {
      const error = await usernameCheckRes.json();
      alert(error.message || "Username is taken");
      return;
    }

    if (usernameCheckRes.status !== 200 && usernameCheckRes.status !== 304) {
      alert("Something went wrong checking the username");
      return;
    }

    // Step 2: Proceed with Firebase Authentication
    const { user, token } = await registerWithEmail(
      data.email,
      data.password,
      data.name
    );

    console.log("✅ Firebase user created:", user);

    // Step 3: Send user data to the backend to create the Firestore document
    const res = await fetch("http://localhost:3000/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: user.uid,
        username: data.username,
        role: data.role,
        email: data.email,
        fullName: data.name,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || "Something went wrong");
      return;
    }

    alert("✅ Registered successfully and sent to backend!");
  } catch (err: any) {
    alert(`❌ Error: ${err.message}`);
    console.error(err);
  }
};
const RegisterSchema = z
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
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(32, "Too long")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/,
        "Password must contain at least one letter and one number"
      ),
    confirmPassword: z.string(),
    role: z.enum(roles, {
      errorMap: () => ({ message: "Please select a role" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Generic Field Component */}
      {[
        {
          label: "Full Name",
          id: "name",
          type: "text",
          placeholder: "Your Full Name",
        },
        {
          label: "Username",
          id: "username",
          type: "text",
          placeholder: "your_username",
        },
        {
          label: "Email",
          id: "email",
          type: "email",
          placeholder: "you@example.com",
        },
        {
          label: "Password",
          id: "password",
          type: "password",
          placeholder: "••••••••",
        },
        {
          label: "Confirm Password",
          id: "confirmPassword",
          type: "password",
          placeholder: "••••••••",
        },
      ].map(({ label, id, type, placeholder }) => (
        <div key={id}>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            {...register(id as keyof RegisterFormValues)}
            type={type}
            placeholder={placeholder}
            className="w-full px-8 py-3 text-base border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-150"
          />
          {errors[id as keyof RegisterFormValues] && (
            <p className="text-sm text-red-500 mt-1">
              {errors[id as keyof RegisterFormValues]?.message?.toString()}
            </p>
          )}
        </div>
      ))}

      {/* Role Selector */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Role
        </label>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileFocus={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <select
            {...register("role")}
            className="w-full px-8 py-3 text-base border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-150"
          >
            <option value="">Select your role</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </motion.div>
        {errors.role && (
          <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <motion.div whileHover={{ scale: 1.03 }}>
        <Button
          type="submit"
          className="w-full bg-green-500 text-white px-8 py-6 text-lg hover:bg-green-600 transition-all duration-200 shadow-lg"
        >
          Register
        </Button>
      </motion.div>
    </form>
  );
}
