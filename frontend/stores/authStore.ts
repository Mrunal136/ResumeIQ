import { create } from "zustand";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { AuthUser } from "@/lib/types";

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post("/auth/login", { email, password });
            set({ user: res.data.user, isAuthenticated: true, isLoading: false });
        } catch (err) {
            set({
                error: getErrorMessage(err, "Login failed"),
                isLoading: false,
            });
            throw err;
        }
    },

    register: async (name, email, password, role = "candidate") => {
        set({ isLoading: true, error: null });
        try {
            await api.post("/auth/register", { name, email, password, role });
            set({ isLoading: false });
        } catch (err) {
            set({
                error: getErrorMessage(err, "Registration failed"),
                isLoading: false,
            });
            throw err;
        }
    },

    logout: async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            set({ user: null, isAuthenticated: false });
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get("/auth/me");
            set({ user: res.data, isAuthenticated: true, isLoading: false });
        } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));
