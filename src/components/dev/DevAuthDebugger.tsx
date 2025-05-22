import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";

const DevAuthDebugger = () => {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border shadow-lg rounded-md p-4 text-xs text-left max-w-sm w-[300px]">
      <strong className="block mb-2 text-gray-700">🔥 Auth Debug</strong>
      <div>
        <b>User:</b> {user ? user.email : "null"}
      </div>
      <div>
        <b>UID:</b> {user?.uid ?? "null"}
      </div>
      <div>
        <b>Role:</b> {role ?? "null"}
      </div>
      <div>
        <b>Email Verified:</b> {user?.emailVerified?.toString() ?? "null"}
      </div>
    </div>
  );
};

export default DevAuthDebugger;
