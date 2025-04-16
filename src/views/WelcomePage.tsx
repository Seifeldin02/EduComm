// src/views/WelcomePage.tsx
import { Button } from "@/components/ui/button";

const WelcomePage = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to EduComm!</h1>
      <div className="flex flex-col gap-4">
        <Button className="px-8 py-6 text-lg">I'm a Student!</Button>
        <Button className="px-8 py-6 text-lg">I'm a Lecturer!</Button>
        <Button className="px-8 py-6 text-lg bg-green-500 hover:bg-green-600">
          I'm New! Register Me!
        </Button>
      </div>
    </div>
  );
};

export default WelcomePage;
