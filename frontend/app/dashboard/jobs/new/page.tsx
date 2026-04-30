"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiOutlineArrowRight, HiOutlineBriefcase } from "react-icons/hi2";

import { EmptyState, PageIntro, SectionCard } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useJobsStore } from "@/stores/jobsStore";

const inputClass =
  "w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-primary";
const labelClass = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted";

function splitSkills(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PostJobPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuthStore();
  const { createJob, isLoading, error, clearError } = useJobsStore();
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    required_skills: "",
    preferred_skills: "",
    min_experience: "0",
    location: "Remote",
    salary_range: "",
    job_type: "full-time",
  });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setLocalError("");

    if (!form.title || !form.company || !form.description) {
      setLocalError("Title, company, and description are required.");
      return;
    }

    try {
      await createJob({
        title: form.title,
        company: form.company,
        description: form.description,
        required_skills: splitSkills(form.required_skills),
        preferred_skills: splitSkills(form.preferred_skills),
        min_experience: Number(form.min_experience) || 0,
        location: form.location,
        salary_range: form.salary_range,
        job_type: form.job_type,
      });

      router.push("/jobs");
    } catch {
      // Store error is already surfaced in the form.
    }
  };

  if (user?.role && user.role !== "recruiter" && user.role !== "admin") {
    return (
      <EmptyState
        icon={HiOutlineBriefcase}
        title="Only recruiters can create jobs"
        description="Candidates can still browse roles and apply with saved resumes, but job posting stays inside the recruiter workspace."
        action={
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
          >
            Browse Jobs
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageIntro
        eyebrow="Job Creation"
        title="Create a role that is easy to match well."
        description="Required skills drive the main score, preferred skills refine fit, and the full description improves the semantic match."
      />

      <SectionCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {localError || error ? (
            <div className="rounded-[1.4rem] border border-warm/20 bg-warm/10 px-4 py-4 text-sm text-warm">
              {localError || error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Job Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className={inputClass}
                placeholder="Senior Backend Engineer"
              />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                className={inputClass}
                placeholder="Northstar Labs"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={8}
              className={`${inputClass} resize-none`}
              placeholder="Describe the outcomes this person owns, the environment they will work in, and what a strong candidate looks like."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Required Skills</label>
              <input
                value={form.required_skills}
                onChange={(event) => setForm((current) => ({ ...current, required_skills: event.target.value }))}
                className={inputClass}
                placeholder="python, fastapi, postgresql, aws"
              />
              <p className="mt-2 text-xs text-text-secondary">These have the strongest impact on candidate match score.</p>
            </div>
            <div>
              <label className={labelClass}>Preferred Skills</label>
              <input
                value={form.preferred_skills}
                onChange={(event) => setForm((current) => ({ ...current, preferred_skills: event.target.value }))}
                className={inputClass}
                placeholder="redis, kubernetes, graphql"
              />
              <p className="mt-2 text-xs text-text-secondary">Nice-to-have skills that help recruiters separate strong applicants.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className={labelClass}>Min Experience</label>
              <input
                type="number"
                min="0"
                value={form.min_experience}
                onChange={(event) => setForm((current) => ({ ...current, min_experience: event.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                className={inputClass}
                placeholder="Remote"
              />
            </div>
            <div>
              <label className={labelClass}>Salary Range</label>
              <input
                value={form.salary_range}
                onChange={(event) => setForm((current) => ({ ...current, salary_range: event.target.value }))}
                className={inputClass}
                placeholder="$120k - $160k"
              />
            </div>
            <div>
              <label className={labelClass}>Job Type</label>
              <select
                value={form.job_type}
                onChange={(event) => setForm((current) => ({ ...current, job_type: event.target.value }))}
                className={inputClass}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Link
              href="/jobs"
              className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isLoading ? "Publishing..." : "Publish Job"}
              <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
