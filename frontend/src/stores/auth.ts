import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isUploader: () => boolean;
  canUpload: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAdmin: () => get().user?.role === "admin",
      isUploader: () => get().user?.role === "uploader",
      canUpload: () => {
        const role = get().user?.role;
        return role === "admin" || role === "uploader";
      },
    }),
    {
      name: "video-archive-auth",
    }
  )
);
