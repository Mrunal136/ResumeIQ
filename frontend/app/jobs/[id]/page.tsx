"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
} from "react-icons/hi2";

import { EmptyState, PageIntro, SectionCard, SkillPill, StatCard } from "@/components/ui";
import type { JobCandidate, JobMatch } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { useJobsStore } from "@/stores/jobsStore";
import { useResumeStore } from "@/stores/resumeStore";

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function MatchPanel({
  title,
  subtitle,
  match,
}: {
  title: string;
  subtitle: string;
  match: JobMatch;
}) {
  return (
    <SectionCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">{subtitle}</h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">{match.ai_explanation}</p>
        </div>
        <div className="rounded-[1.7rem] bg-primary/10 px-5 py-4 text-center">
          <p className="text-4xl font-semibold tracking-[-0.05em] text-primary">{match.match_score}%</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-text-muted">overall match</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <MetricTile label="Required Skills" value={`${match.breakdown.required_skill_score}%`} />
        <MetricTile label="Preferred Skills" value={`${match.breakdown.preferred_skill_score}%`} tone="accent" />
        <MetricTile label="Experience" value={`${match.breakdown.experience_score}%`} tone="info" />
        <MetricTile label="Semantic Fit" value={`${match.breakdown.semantic_score}%`} tone="warm" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SkillGroup title="Matched Skills" skills={match.matched_skills} tone="success" emptyLabel="No overlap yet" />
        <SkillGroup title="Missing Skills" skills={match.missing_skills} tone="warning" emptyLabel="No major gaps" />
      </div>

      {match.improvement_tips.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-semibold text-text">Improvement ideas</p>
          <div className="mt-3 space-y-3">
            {match.improvement_tips.map((tip) => (
              <div key={tip} className="rounded-[1.25rem] border border-border/70 bg-surface-hover/55 px-4 py-3 text-sm leading-6 text-text-secondary">
                {tip}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

function MetricTile({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "accent" | "info" | "warm";
}) {
  const textClass = {
    primary: "text-primary",
    accent: "text-accent",
    info: "text-info",
    warm: "text-warm",
  }[tone];

  return (
    <div className="rounded-[1.4rem] bg-surface-hover/65 p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${textClass}`}>{value}</p>
    </div>
  );
}

function SkillGroup({
  title,
  skills,
  tone,
  emptyLabel,
}: {
  title: string;
  skills: string[];
  tone: "success" | "warning";
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-surface-hover/40 p-5">
      <p className="text-sm font-semibold text-text">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <SkillPill key={skill} tone={tone === "success" ? "success" : "warning"}>
              {skill}
            </SkillPill>
          ))
        ) : (
          <p className="text-sm text-text-secondary">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

function ApplicantCard({ candidate }: { candidate: JobCandidate }) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-surface-hover/45 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold tracking-[-0.04em] text-text">{candidate.name}</h3>
            <SkillPill tone="info">{candidate.resume_label}</SkillPill>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{candidate.email}</p>
          <p className="mt-3 text-sm leading-6 text-text-secondary">{candidate.ai_summary || candidate.ai_explanation}</p>
        </div>
        <div className="rounded-[1.5rem] bg-primary/10 px-4 py-3 text-center">
          <p className="text-3xl font-semibold tracking-[-0.05em] text-primary">{candidate.match_score}%</p>
          <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">match</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <MetricTile label="Required" value={`${candidate.breakdown.required_skill_score}%`} />
        <MetricTile label="Preferred" value={`${candidate.breakdown.preferred_skill_score}%`} tone="accent" />
        <MetricTile label="Experience" value={`${candidate.breakdown.experience_score}%`} tone="info" />
        <MetricTile label="Semantic" value={`${candidate.breakdown.semantic_score}%`} tone="warm" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SkillGroup title="Matched" skills={candidate.matched_skills} tone="success" emptyLabel="No overlap recorded" />
        <SkillGroup title="Missing" skills={candidate.missing_skills} tone="warning" emptyLabel="No gaps recorded" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
        <span>{candidate.experience_years} years experience</span>
        <span>{candidate.education}</span>
        <span>Applied {formatDate(candidate.applied_at)}</span>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const { user, checkAuth } = useAuthStore();
  const {
    currentJob,
    matchPreview,
    currentApplication,
    candidates,
    fetchJob,
    previewMatch,
    applyToJob,
    fetchCandidates,
    clearMatch,
    clearError,
    error,
    isLoading,
  } = useJobsStore();
  const { resumes, fetchResumes, uploadResume } = useResumeStore();

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    fetchJob(jobId);
    clearMatch();
    clearError();
  }, [jobId, fetchJob, clearMatch, clearError]);

  useEffect(() => {
    if (user?.role === "candidate") {
      fetchResumes();
    }
  }, [user, fetchResumes]);

  useEffect(() => {
    if (!currentJob || !user) return;
    if ((user.role === "recruiter" || user.role === "admin") && currentJob.created_by === user.id) {
      fetchCandidates(jobId);
    }
  }, [currentJob, user, fetchCandidates, jobId]);

  const displayMatch = matchPreview ?? currentApplication ?? currentJob?.my_application ?? null;
  const effectiveSelectedResumeId = selectedResumeId || resumes.find((resume) => resume.is_default)?.id || resumes[0]?.id || "";
  const isOwnerRecruiter = Boolean(
    user && currentJob && (user.role === "recruiter" || user.role === "admin") && currentJob.created_by === user.id,
  );
  const candidateStats = useMemo(() => {
    if (!candidates.length) return { average: 0, topScore: 0 };
    const totalScore = candidates.reduce((sum, candidate) => sum + candidate.match_score, 0);
    return {
      average: Math.round(totalScore / candidates.length),
      topScore: candidates[0]?.match_score ?? 0,
    };
  }, [candidates]);

  if (isLoading && !currentJob) {
    return <div className="py-24 text-center text-sm text-text-secondary">Loading job details...</div>;
  }

  if (!currentJob) {
    return <div className="py-24 text-center text-sm text-text-secondary">Job not found.</div>;
  }

  const handleUploadAndSelect = async () => {
    if (!newResumeFile) return;
    try {
      const uploaded = await uploadResume(newResumeFile);
      setSelectedResumeId(uploaded.id);
      setNewResumeFile(null);
    } catch {
      // Resume store already exposes the error.
    }
  };

  const candidateActionPanel = (
    <SectionCard>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Application Flow</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Choose which resume to use</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        You can preview the score first, then apply with the same saved resume. Your default resume is preselected to save time.
      </p>

      {resumes.length === 0 ? (
        <EmptyState
          icon={HiOutlineDocumentText}
          title="Upload a resume to continue"
          description="The platform needs at least one saved resume before it can calculate your score or submit an application."
          action={
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
            >
              Upload Resume
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">Saved Resume</label>
              <select
                value={effectiveSelectedResumeId}
                onChange={(event) => setSelectedResumeId(event.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary"
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.label} {resume.is_default ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => previewMatch(jobId, effectiveSelectedResumeId)}
                className="inline-flex h-[52px] items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text"
              >
                Preview Score
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => applyToJob(jobId, effectiveSelectedResumeId)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
            >
              {currentApplication ? "Update Application" : "Apply With This Resume"}
              <HiOutlineArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text"
            >
              Manage Resume Library
            </Link>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-surface-hover/45 p-5">
            <p className="text-sm font-semibold text-text">Want a different version for this role?</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Upload a fresh resume here, then preview or apply with it immediately without leaving the job page.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text">
                <HiOutlineCloudArrowUp className="h-4 w-4" />
                {newResumeFile ? newResumeFile.name : "Choose New Resume"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(event) => setNewResumeFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <button
                onClick={handleUploadAndSelect}
                disabled={!newResumeFile}
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
              >
                Upload and Select
              </button>
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageIntro
        eyebrow={isOwnerRecruiter ? "Recruiter Review" : "Job Detail"}
        title={currentJob.title}
        description={`${currentJob.company} · ${currentJob.location} · ${currentJob.job_type} · ${currentJob.min_experience}+ years`}
        actions={
          <div className="flex flex-wrap gap-2">
            <SkillPill tone="success">{currentJob.status}</SkillPill>
            <SkillPill tone="info">{currentJob.application_count} applicants</SkillPill>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Role Overview</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">What this job is looking for</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text-secondary">{currentJob.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricTile label="Location" value={currentJob.location} />
            <MetricTile label="Compensation" value={currentJob.salary_range || "Not shared"} tone="accent" />
            <MetricTile label="Posted" value={formatDate(currentJob.created_at)} tone="info" />
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-text">Required skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentJob.required_skills.map((skill) => (
                  <SkillPill key={skill} tone="success">
                    {skill}
                  </SkillPill>
                ))}
              </div>
            </div>
            {currentJob.preferred_skills?.length ? (
              <div>
                <p className="text-sm font-semibold text-text">Preferred skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentJob.preferred_skills.map((skill) => (
                    <SkillPill key={skill} tone="warning">
                      {skill}
                    </SkillPill>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>

        {user?.role === "candidate" ? candidateActionPanel : (
          <SectionCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Recruiter Notes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">
              {isOwnerRecruiter ? "Applicant review is ready below." : "You can read the role details here."}
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {isOwnerRecruiter
                ? "This role now shows only submitted candidates. Each card includes score breakdown, matched skills, and missing skills to speed up screening."
                : "Only the recruiter who created this job can open the applicant review list."}
            </p>
          </SectionCard>
        )}
      </div>

      {error ? (
        <SectionCard className="border-warm/20 bg-warm/10 text-sm text-warm">{error}</SectionCard>
      ) : null}

      {user?.role === "candidate" && displayMatch ? (
        <MatchPanel
          title={displayMatch.status === "submitted" ? "Submitted Application" : "Match Preview"}
          subtitle={`${displayMatch.resume_label} ${displayMatch.applied_at ? `· applied ${formatDate(displayMatch.applied_at)}` : "· not submitted yet"}`}
          match={displayMatch}
        />
      ) : null}

      {isOwnerRecruiter ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard icon={HiOutlineUserGroup} label="Applicants" value={candidates.length} detail="Submitted candidates for this role" />
            <StatCard icon={HiOutlineClipboardDocumentCheck} label="Average Match" value={`${candidateStats.average}%`} detail="Average across submitted applications" tone="accent" />
            <StatCard icon={HiOutlineCheckCircle} label="Top Score" value={`${candidateStats.topScore}%`} detail="Best current applicant score" tone="warm" />
          </div>

          {candidates.length === 0 ? (
            <EmptyState
              icon={HiOutlineUserGroup}
              title="No applicants yet"
              description="Once candidates apply, you will see their selected resume version, matched skills, missing skills, and overall score here."
            />
          ) : (
            <SectionCard>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Applicant Review</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Candidates who actually applied</h2>
                </div>
                <SkillPill tone="info">{candidates.length} submissions</SkillPill>
              </div>
              <div className="mt-5 space-y-4">
                {candidates.map((candidate) => (
                  <ApplicantCard key={candidate.id} candidate={candidate} />
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      ) : null}
    </div>
  );
}
