import { create } from "zustand";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

interface RankedCandidate {
    id: string;
    candidate_id: string;
    name: string;
    email: string;
    skills: string[];
    experience_years: number;
    education: string;
    match_score: number;
    skill_match_percent: number;
    matched_skills: string[];
    missing_skills: string[];
}

interface RankingState {
    candidates: RankedCandidate[];
    jobTitle: string;
    totalCandidates: number;
    isLoading: boolean;
    error: string | null;
    rankCandidates: (payload: {
        title: string;
        description: string;
        required_skills: string[];
        min_experience: number;
        top_n: number;
    }) => Promise<void>;
    clearRankings: () => void;
}

export const useRankingStore = create<RankingState>((set) => ({
    candidates: [],
    jobTitle: "",
    totalCandidates: 0,
    isLoading: false,
    error: null,

    rankCandidates: async (payload) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post("/ranking/rank", payload);
            set({
                candidates: res.data.candidates,
                jobTitle: res.data.job_title,
                totalCandidates: res.data.total_candidates,
                isLoading: false,
            });
        } catch (err) {
            set({
                error: getErrorMessage(err, "Ranking failed"),
                isLoading: false,
            });
        }
    },

    clearRankings: () =>
        set({ candidates: [], jobTitle: "", totalCandidates: 0, error: null }),
}));
