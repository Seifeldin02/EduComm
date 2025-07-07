import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { API_CONFIG } from "@/config/api";
export const useFirebaseAuthListener = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const setRole = useAuthStore((s) => s.setRole);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user ?? null);

      if (user) {
        try {
          const token = await user.getIdToken();

          // Just get the user's role without requiring a specific role
          const res = await fetch(
            `${API_CONFIG.BASE_URL}/api/users/verify-role`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ requiredRole: null }),
            }
          );

          if (res.ok) {
            const { role } = await res.json();
            setRole(role);
          } else {
            const errorData = await res.json();
            console.error("Failed to get role:", errorData);
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
      setLoading(false);
    });

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [setUser, setRole, setAuthReady, setLoading]);
};

export default useFirebaseAuthListener;
