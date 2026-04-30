import { create } from "zustand";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { Job, JobCandidate, JobMatch } from "@/lib/types";

interface JobsState {
    jobs: Job[];
    currentJob: Job | null;
    matchPreview: JobMatch | null;
    currentApplication: JobMatch | null;
    candidates: JobCandidate[];
    total: number;
    isLoading: boolean;
    error: string | null;
    fetchJobs: () => Promise<void>;
    fetchJob: (id: string) => Promise<void>;
    createJob: (data: Partial<Job>) => Promise<void>;
    previewMatch: (jobId: string, resumeId?: string) => Promise<JobMatch | null>;
    applyToJob: (jobId: string, resumeId?: string) => Promise<JobMatch | null>;
    fetchApplication: (jobId: string) => Promise<void>;
    fetchCandidates: (jobId: string) => Promise<void>;
    clearMatch: () => void;
    clearError: () => void;
}

export const useJobsStore = create<JobsState>((set) => ({
    jobs: [],
    currentJob: null,
    matchPreview: null,
    currentApplication: null,
    candidates: [],
    total: 0,
    isLoading: false,
    error: null,

    fetchJobs: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get("/jobs/");
            set({ jobs: res.data.jobs, total: res.data.total, isLoading: false });
        } catch (err) {
            set({ error: getErrorMessage(err, "Failed to fetch jobs"), isLoading: false });
        }
    },

    fetchJob: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get(`/jobs/${id}`);
            set({
                currentJob: res.data,
                currentApplication: res.data.my_application ?? null,
                isLoading: false,
            });
        } catch (err) {
            set({ error: getErrorMessage(err, "Job not found"), isLoading: false });
        }
    },

    createJob: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await api.post("/jobs/", data);
            set({ isLoading: false });
        } catch (err) {
            set({ error: getErrorMessage(err, "Failed to create job"), isLoading: false });
            throw err;
        }
    },

    previewMatch: async (jobId, resumeId) => {
        set({ isLoading: true, error: null, matchPreview: null });
        try {
            const res = await api.post(`/jobs/${jobId}/match`, { resume_id: resumeId ?? null });
            set({ matchPreview: res.data, isLoading: false });
            return res.data;
        } catch (err) {
            set({ error: getErrorMessage(err, "Match failed"), isLoading: false });
            return null;
        }
    },

    applyToJob: async (jobId, resumeId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post(`/jobs/${jobId}/apply`, { resume_id: resumeId ?? null });
            set((state) => ({
                currentApplication: res.data,
                matchPreview: res.data,
                currentJob: state.currentJob ? { ...state.currentJob, my_application: res.data } : state.currentJob,
                jobs: state.jobs.map((job) =>
                    job.id === jobId
                        ? { ...job, has_applied: true, my_match_score: res.data.match_score }
                        : job
                ),
                isLoading: false,
            }));
            return res.data;
        } catch (err) {
            set({ error: getErrorMessage(err, "Application failed"), isLoading: false });
            return null;
        }
    },

    fetchApplication: async (jobId) => {
        try {
            const res = await api.get(`/jobs/${jobId}/application`);
            set({ currentApplication: res.data });
        } catch {
            set({ currentApplication: null });
        }
    },

    fetchCandidates: async (jobId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get(`/jobs/${jobId}/candidates`);
            set({ candidates: res.data.candidates, isLoading: false });
        } catch (err) {
            set({ error: getErrorMessage(err, "Failed to fetch candidates"), isLoading: false });
        }
    },

    clearMatch: () => set({ matchPreview: null }),
    clearError: () => set({ error: null }),
}));
