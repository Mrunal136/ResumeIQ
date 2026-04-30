import { create } from "zustand";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { CandidateInsights, CandidateProfile, JobMatch } from "@/lib/types";

interface CandidateState {
    profile: CandidateProfile | null;
    matches: JobMatch[];
    insights: CandidateInsights | null;
    isLoading: boolean;
    error: string | null;
    fetchProfile: () => Promise<void>;
    fetchMatches: () => Promise<void>;
    fetchInsights: () => Promise<void>;
    clearError: () => void;
}

export const useCandidateStore = create<CandidateState>((set) => ({
    profile: null,
    matches: [],
    insights: null,
    isLoading: false,
    error: null,

    fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get("/candidates/profile");
            set({ profile: res.data, isLoading: false });
        } catch (err) {
            set({ error: getErrorMessage(err, "Failed to load profile"), isLoading: false });
        }
    },

    fetchMatches: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get("/candidates/matches");
            set({ matches: res.data.matches, isLoading: false });
        } catch (err) {
            set({ error: getErrorMessage(err, "Failed to load matches"), isLoading: false });
        }
    },

    fetchInsights: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get("/candidates/insights");
            set({ insights: res.data, isLoading: false });
        } catch (err) {
            set({ error: getErrorMessage(err, "Failed to load insights"), isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));
