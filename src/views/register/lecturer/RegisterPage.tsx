import { motion } from "framer-motion";
import RegisterForm from "../RegisterForm";
const RegisterPage = () => {
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
        Create Your Account
      </motion.h1>

      {/* Form Placeholder */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
          <RegisterForm role="Lecturer" />
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
