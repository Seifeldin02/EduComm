import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/auth";
import { useAuthStore } from "@/store/useAuthStore";

export const useFirebaseAuthListener = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true); // Start loading when the effect runs

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user ?? null);

      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("http://localhost:3000/api/users/verify-role", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const { role } = await res.json();
            setRole(role);
          } else {
            console.error("Failed to get role:", await res.text());
            setRole(null);
          }
        } catch (error) {
          console.error("Error verifying role:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setAuthReady(true);
      setLoading(false); // Stop loading after everything is done
    });

    return () => {
      unsubscribe();
      setLoading(false); // Clean up loading state on unmount
    };
  }, [setUser, setRole, setAuthReady, setLoading]);
};

export default useFirebaseAuthListener;
