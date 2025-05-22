// src/components/AnimationWrapper.tsx
import { ReactNode } from "react";
import { motion } from "framer-motion";

const variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

interface AnimationWrapperProps {
  children: ReactNode;
}

export const AnimationWrapper = ({ children }: AnimationWrapperProps) => {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};
