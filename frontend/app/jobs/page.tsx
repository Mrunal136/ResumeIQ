"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineUserGroup,
} from "react-icons/hi2";

import { EmptyState, PageIntro, SectionCard, SkillPill, StatCard } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useJobsStore } from "@/stores/jobsStore";

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function JobsPage() {
  const { user, checkAuth } = useAuthStore();
  const { jobs, isLoading, fetchJobs } = useJobsStore();

  useEffect(() => {
    checkAuth();
    fetchJobs();
  }, [checkAuth, fetchJobs]);

  const ownJobs = useMemo(
    () => jobs.filter((job) => (user?.role === "recruiter" || user?.role === "admin") && job.created_by === user.id),
    [jobs, user],
  );

  const visibleJobs = user?.role === "candidate" ? jobs.filter((job) => job.status === "open") : ownJobs;
  const appliedJobs = jobs.filter((job) => job.has_applied).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageIntro
        eyebrow={user?.role === "candidate" ? "Job Board" : "Recruiter Jobs"}
        title={
          user?.role === "candidate"
            ? "Find the roles where your resume already fits."
            : "Track the jobs you own and the applicants coming in."
        }
        description={
          user?.role === "candidate"
            ? "Preview your score with a saved resume, apply with one click, and keep the history tied to each job."
            : "Each job shows actual submitted applicants, so you can review score breakdowns and missing skills in context."
        }
        actions={
          user?.role === "candidate" ? (
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text"
            >
              <HiOutlineDocumentText className="h-4 w-4" />
              Manage Resumes
            </Link>
          ) : (
            <Link
              href="/dashboard/jobs/new"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
            >
              Create Job
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {user?.role === "candidate" ? (
          <>
            <StatCard icon={HiOutlineBriefcase} label="Open Roles" value={visibleJobs.length} detail="Jobs currently accepting applications" />
            <StatCard icon={HiOutlineSparkles} label="Applied Jobs" value={appliedJobs} detail="Roles where you already submitted a resume" tone="accent" />
            <StatCard icon={HiOutlineDocumentText} label="Match Ready" value={jobs.filter((job) => !job.has_applied).length} detail="Roles waiting for a quick preview" tone="info" />
          </>
        ) : (
          <>
            <StatCard icon={HiOutlineBriefcase} label="My Jobs" value={ownJobs.length} detail="Roles created from your account" />
            <StatCard icon={HiOutlineUserGroup} label="Applicants" value={ownJobs.reduce((sum, job) => sum + job.application_count, 0)} detail="Submitted candidates across your jobs" tone="accent" />
            <StatCard icon={HiOutlineSparkles} label="Open Roles" value={ownJobs.filter((job) => job.status === "open").length} detail="Currently visible to candidates" tone="warm" />
          </>
        )}
      </div>

      {isLoading ? (
        <SectionCard className="py-20 text-center text-sm text-text-secondary">Loading jobs...</SectionCard>
      ) : visibleJobs.length === 0 ? (
        <EmptyState
          icon={HiOutlineBriefcase}
          title={user?.role === "candidate" ? "No open jobs right now" : "You have not posted any jobs yet"}
          description={
            user?.role === "candidate"
              ? "Check back soon or update your default resume so you are ready when new openings appear."
              : "Create your first role to start collecting applications with match scores and skill-gap data."
          }
          action={
            user?.role === "candidate" ? (
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
              >
                Prepare Resume
              </Link>
            ) : (
              <Link
                href="/dashboard/jobs/new"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
              >
                Create Job
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="rounded-[1.75rem] border border-border/70 bg-surface/90 p-6 shadow-[0_16px_48px_rgba(7,36,36,0.06)] transition hover:border-primary/30 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-text">{job.title}</h2>
                    <SkillPill tone={job.status === "open" ? "success" : "warning"}>{job.status}</SkillPill>
                    {job.has_applied ? <SkillPill tone="info">Applied</SkillPill> : null}
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    {job.company} · {job.location} · {job.job_type}
                  </p>
                </div>
                {user?.role === "candidate" ? (
                  <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right">
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-primary">
                      {job.my_match_score != null ? `${job.my_match_score}%` : "--"}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">your score</p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-accent/10 px-3 py-2 text-right">
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-accent">{job.application_count}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">applicants</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {job.required_skills.slice(0, 6).map((skill) => (
                  <SkillPill key={skill} tone="success">
                    {skill}
                  </SkillPill>
                ))}
                {job.required_skills.length > 6 ? <SkillPill tone="neutral">+{job.required_skills.length - 6} more</SkillPill> : null}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-surface-hover/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Experience</p>
                  <p className="mt-2 text-sm font-semibold text-text">{job.min_experience}+ years</p>
                </div>
                <div className="rounded-2xl bg-surface-hover/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Compensation</p>
                  <p className="mt-2 text-sm font-semibold text-text">{job.salary_range || "Not shared"}</p>
                </div>
                <div className="rounded-2xl bg-surface-hover/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Created</p>
                  <p className="mt-2 text-sm font-semibold text-text">{formatDate(job.created_at)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
