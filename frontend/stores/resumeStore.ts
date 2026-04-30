import { create } from "zustand";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { Resume } from "@/lib/types";

interface ResumeState {
    resumes: Resume[];
    total: number;
    isLoading: boolean;
    error: string | null;
    fetchResumes: (params?: {
        skip?: number;
        limit?: number;
        skills?: string;
        min_experience?: number;
    }) => Promise<void>;
    uploadResume: (file: File) => Promise<Resume>;
    deleteResume: (id: string) => Promise<void>;
    setDefaultResume: (id: string) => Promise<void>;
    clearError: () => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
    resumes: [],
    total: 0,
    isLoading: false,
    error: null,

    fetchResumes: async (params) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get("/resumes/", { params });
            set({ resumes: res.data.resumes, total: res.data.total, isLoading: false });
        } catch (err) {
            set({ error: getErrorMessage(err, "Failed to fetch resumes"), isLoading: false });
        }
    },

    uploadResume: async (file) => {
        set({ isLoading: true, error: null });
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post("/resumes/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            await get().fetchResumes();
            set({ isLoading: false });
            return res.data;
        } catch (err) {
            set({ error: getErrorMessage(err, "Upload failed"), isLoading: false });
            throw err;
        }
    },

    deleteResume: async (id) => {
        try {
            await api.delete(`/resumes/${id}`);
            set((s) => ({
                resumes: s.resumes.filter((r) => r.id !== id),
                total: s.total - 1,
            }));
        } catch (err) {
            set({ error: getErrorMessage(err, "Delete failed") });
        }
    },

    setDefaultResume: async (id) => {
        try {
            await api.post(`/resumes/${id}/default`);
            await get().fetchResumes();
        } catch (err) {
            set({ error: getErrorMessage(err, "Failed to update default resume") });
        }
    },

    clearError: () => set({ error: null }),
}));
