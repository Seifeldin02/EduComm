import { create } from "zustand";
import { User } from "firebase/auth";

type Role = "Student" | "Lecturer" | null;

interface AuthState {
  user: User | null;
  role: Role;
  isAuthReady: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setRole: (role: Role) => void;
  setAuthReady: (ready: boolean) => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  role: null,
  isAuthReady: false,
  isLoading: true,

  // Actions
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
