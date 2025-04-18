// Zustand store for registration state
import { create } from "zustand";

interface RegistrationState {
  name: string;
  email: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  name: "",
  email: "",
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
}));
