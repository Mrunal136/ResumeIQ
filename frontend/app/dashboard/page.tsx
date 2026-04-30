"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowUpTray,
} from "react-icons/hi2";

import { EmptyState, PageIntro, SectionCard, SkillPill, StatCard } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useCandidateStore } from "@/stores/candidateStore";
import { useJobsStore } from "@/stores/jobsStore";
import { useResumeStore } from "@/stores/resumeStore";

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardPage() {
  const { user, checkAuth, isLoading: authLoading } = useAuthStore();
  const { jobs, fetchJobs, isLoading: jobsLoading } = useJobsStore();
  const { resumes, fetchResumes, isLoading: resumesLoading } = useResumeStore();
  const {
    profile,
    matches,
    insights,
    fetchProfile,
    fetchMatches,
    fetchInsights,
    isLoading: candidateLoading,
  } = useCandidateStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;

    if (user.role === "candidate") {
      fetchResumes();
      fetchProfile();
      fetchMatches();
      fetchInsights();
      return;
    }

    fetchJobs();
  }, [user, fetchJobs, fetchInsights, fetchMatches, fetchProfile, fetchResumes]);

  const isLoading = authLoading || jobsLoading || resumesLoading || candidateLoading;

  if (!user && isLoading) {
    return <div className="py-24 text-center text-sm text-text-secondary">Loading workspace...</div>;
  }

  if (!user) {
    return null;
  }

  if (user.role === "candidate") {
    const defaultResume = resumes.find((resume) => resume.is_default) ?? resumes[0] ?? null;

    return (
      <div className="space-y-6 animate-fade-in">
        <PageIntro
          eyebrow="Candidate Dashboard"
          title={`Keep your job search moving, ${user.name.split(" ")[0]}.`}
          description="Upload once, reuse your best resume across applications, and keep an eye on your strongest matches and skill gaps."
          actions={
            <>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse shadow-[0_14px_40px_rgba(15,118,110,0.25)] transition hover:bg-primary-hover"
              >
                Browse Jobs
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text"
              >
                <HiOutlineArrowUpTray className="h-4 w-4" />
                Manage Resumes
              </Link>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={HiOutlineDocumentText} label="Saved Resumes" value={resumes.length} detail={defaultResume ? `Default: ${defaultResume.label}` : "Upload your first resume"} />
          <StatCard icon={HiOutlineBriefcase} label="Applications" value={profile?.total_applications ?? matches.length} detail="Tracked from your submitted matches" tone="accent" />
          <StatCard icon={HiOutlineChartBar} label="Average Match" value={`${insights?.avg_match_score ?? 0}%`} detail={insights?.best_match_job ? `Best fit: ${insights.best_match_job}` : "No applications yet"} tone="info" />
          <StatCard icon={HiOutlineArrowTrendingUp} label="Skill Coverage" value={`${insights?.skill_gap_analysis?.overall_coverage ?? 0}%`} detail={`${insights?.skill_gaps?.length ?? 0} market gaps spotted`} tone="warm" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Default Resume</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">
                  {defaultResume ? defaultResume.label : "No default resume yet"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {profile?.ai_summary || "Upload a resume and we’ll summarize your profile automatically for fast review."}
                </p>
              </div>
              <Link
                href="/dashboard/upload"
                className="hidden rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text sm:inline-flex"
              >
                Edit
              </Link>
            </div>

            {defaultResume ? (
              <>
                <div className="mt-5 flex flex-wrap gap-2">
                  {defaultResume.skills.slice(0, 10).map((skill) => (
                    <SkillPill key={skill} tone="success">
                      {skill}
                    </SkillPill>
                  ))}
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-surface-hover/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Experience</p>
                    <p className="mt-2 text-lg font-semibold text-text">{defaultResume.experience_years} years</p>
                  </div>
                  <div className="rounded-2xl bg-surface-hover/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Education</p>
                    <p className="mt-2 text-lg font-semibold text-text">{defaultResume.education}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-hover/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Updated</p>
                    <p className="mt-2 text-lg font-semibold text-text">{formatDate(defaultResume.created_at)}</p>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={HiOutlineArrowUpTray}
                title="Add a reusable resume"
                description="Your default resume is used automatically when you preview a match or apply to a job, so you do not need to upload it every time."
                action={
                  <Link
                    href="/dashboard/upload"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
                  >
                    Upload Resume
                  </Link>
                }
              />
            )}
          </SectionCard>

          <SectionCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Career Signals</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">What to sharpen next</h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-semibold text-text">High-value gaps</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(insights?.skill_gaps ?? []).slice(0, 8).map((skill) => (
                    <SkillPill key={skill} tone="warning">
                      {skill}
                    </SkillPill>
                  ))}
                  {!(insights?.skill_gaps?.length) ? (
                    <p className="text-sm text-text-secondary">Upload a resume and match a few jobs to uncover skill gaps.</p>
                  ) : null}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-text">Suggestions</p>
                <div className="mt-3 space-y-3">
                  {(insights?.career_tips ?? []).slice(0, 4).map((tip) => (
                    <div key={tip} className="rounded-2xl border border-border/70 bg-surface-hover/70 p-4 text-sm leading-6 text-text-secondary">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Recent Applications</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Your latest match results</h2>
            </div>
            <Link href="/profile" className="text-sm font-semibold text-primary transition hover:text-primary-hover">
              View all
            </Link>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              icon={HiOutlineSparkles}
              title="No matches yet"
              description="Open the job board, preview a score with your saved resume, and submit when you are ready."
              action={
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
                >
                  Explore Open Roles
                </Link>
              }
            />
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {matches.slice(0, 4).map((match) => (
                <Link
                  key={`${match.job_id}-${match.resume_id}`}
                  href={`/jobs/${match.job_id}`}
                  className="rounded-[1.5rem] border border-border/70 bg-surface-hover/40 p-5 transition hover:border-primary/25 hover:bg-surface-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-text">{match.job_title}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{match.company}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right">
                      <p className="text-2xl font-semibold tracking-[-0.04em] text-primary">{match.match_score}%</p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">match</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {match.matched_skills.slice(0, 4).map((skill) => (
                      <SkillPill key={skill} tone="success">
                        {skill}
                      </SkillPill>
                    ))}
                    {match.missing_skills.slice(0, 2).map((skill) => (
                      <SkillPill key={skill} tone="warning">
                        {skill}
                      </SkillPill>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-text-secondary">{match.ai_explanation}</p>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  const ownJobs = jobs.filter((job) => job.created_by === user.id);
  const totalApplicants = ownJobs.reduce((total, job) => total + job.application_count, 0);
  const openJobs = ownJobs.filter((job) => job.status === "open").length;
  const topJob = [...ownJobs].sort((a, b) => b.application_count - a.application_count)[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageIntro
        eyebrow="Recruiter Dashboard"
        title={`Run a cleaner hiring pipeline, ${user.name.split(" ")[0]}.`}
        description="Create jobs, review real applicants instead of loose resume dumps, and use the matching breakdown to decide who deserves the next conversation."
        actions={
          <>
            <Link
              href="/dashboard/jobs/new"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse shadow-[0_14px_40px_rgba(15,118,110,0.25)] transition hover:bg-primary-hover"
            >
              Create Job
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text"
            >
              <HiOutlineClipboardDocumentList className="h-4 w-4" />
              View Jobs
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={HiOutlineBriefcase} label="My Jobs" value={ownJobs.length} detail="Live and archived roles you own" />
        <StatCard icon={HiOutlineChartBar} label="Open Roles" value={openJobs} detail="Open jobs visible to candidates" tone="accent" />
        <StatCard icon={HiOutlineDocumentText} label="Applicants" value={totalApplicants} detail="Submitted applications across your jobs" tone="info" />
        <StatCard icon={HiOutlineArrowTrendingUp} label="Top Funnel" value={topJob ? topJob.application_count : 0} detail={topJob ? topJob.title : "Create a job to start collecting applicants"} tone="warm" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Pipeline Snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Jobs that need attention</h2>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-primary transition hover:text-primary-hover">
              See all jobs
            </Link>
          </div>

          {ownJobs.length === 0 ? (
            <EmptyState
              icon={HiOutlineBriefcase}
              title="No jobs posted yet"
              description="Create your first role to start receiving candidate applications with match scores, missing skills, and resume summaries."
              action={
                <Link
                  href="/dashboard/jobs/new"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
                >
                  Post a Job
                </Link>
              }
            />
          ) : (
            <div className="mt-5 space-y-4">
              {ownJobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block rounded-[1.5rem] border border-border/70 bg-surface-hover/40 p-5 transition hover:border-primary/25 hover:bg-surface-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-text">{job.title}</h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        {job.company} · {job.location} · {job.job_type}
                      </p>
                    </div>
                    <SkillPill tone={job.status === "open" ? "success" : "warning"}>{job.status}</SkillPill>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.required_skills.slice(0, 5).map((skill) => (
                      <SkillPill key={skill} tone="info">
                        {skill}
                      </SkillPill>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span>{job.application_count} applicants</span>
                    <span>{job.min_experience}+ years expected</span>
                    <span>Created {formatDate(job.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">How This Works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">A tighter review loop</h2>
          <div className="mt-5 space-y-4">
            {[
              "Candidates save one or more resumes and pick which one to use per application.",
              "Every application stores its own score, matched skills, missing skills, and explanation.",
              "Recruiters review only submitted applicants for that job, not the entire resume database.",
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-[1.35rem] border border-border/70 bg-surface-hover/55 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
