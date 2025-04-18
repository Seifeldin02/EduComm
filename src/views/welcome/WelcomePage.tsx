// src/views/WelcomePage.tsx
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
const WelcomePage = () => {
  const navigate = useNavigate();
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

      {/* Catchphrase */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-2xl md:text-3xl font-semibold text-gray-700 mb-10 text-center"
      >
        Bridging Students & Lecturers, Seamlessly.
      </motion.h1>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <Button className="bg-white px-8 py-6 text-lg hover:bg-gray-100 transition-all duration-200 shadow-md">
          I’m a Student!
        </Button>
        <Button className="bg-white px-8 py-6 text-lg hover:bg-gray-100 transition-all duration-200 shadow-md">
          I’m a Lecturer!
        </Button>
        <Button
          className="bg-green-500 text-white px-8 py-6 text-lg hover:bg-green-600 transition-all duration-200 shadow-lg"
          onClick={() => navigate("/register")}
        >
          I’m New! Register Me!
        </Button>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
