"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineArrowTrendingUp,
} from "react-icons/hi2";

import { EmptyState, PageIntro, SectionCard, SkillPill, StatCard } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useCandidateStore } from "@/stores/candidateStore";

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ProfilePage() {
  const { user, checkAuth } = useAuthStore();
  const { profile, matches, insights, isLoading, fetchProfile, fetchMatches, fetchInsights } = useCandidateStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user?.role === "candidate") {
      fetchProfile();
      fetchMatches();
      fetchInsights();
    }
  }, [user, fetchProfile, fetchMatches, fetchInsights]);

  if (user?.role && user.role !== "candidate") {
    return (
      <EmptyState
        icon={HiOutlineDocumentText}
        title="Candidate profile only"
        description="This page tracks a candidate's saved resume, applications, and market-fit insights."
        action={
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
          >
            Back to Dashboard
          </Link>
        }
      />
    );
  }

  if (isLoading && !profile) {
    return <div className="py-24 text-center text-sm text-text-secondary">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageIntro
        eyebrow="Candidate Profile"
        title={profile?.name ?? "Your profile"}
        description={profile?.ai_summary || "Upload a resume and apply to jobs to build a richer candidate profile."}
        actions={
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text"
          >
            <HiOutlineDocumentText className="h-4 w-4" />
            Manage Resumes
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={HiOutlineDocumentText} label="Default Resume" value={profile?.default_resume_label ?? "None"} detail={`${profile?.resume_count ?? 0} saved versions`} />
        <StatCard icon={HiOutlineChartBar} label="Applications" value={profile?.total_applications ?? 0} detail="Submitted match records" tone="accent" />
        <StatCard icon={HiOutlineArrowTrendingUp} label="Average Match" value={`${insights?.avg_match_score ?? 0}%`} detail={insights?.best_match_job ? `Best role: ${insights.best_match_job}` : "No best role yet"} tone="info" />
        <StatCard icon={HiOutlineSparkles} label="Coverage" value={`${insights?.skill_gap_analysis?.overall_coverage ?? 0}%`} detail={`${insights?.skill_gaps?.length ?? 0} high-value gaps`} tone="warm" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Profile Summary</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">What recruiters will see first</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] bg-surface-hover/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Experience</p>
              <p className="mt-2 text-lg font-semibold text-text">{profile?.experience_years ?? 0} years</p>
            </div>
            <div className="rounded-[1.4rem] bg-surface-hover/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Education</p>
              <p className="mt-2 text-lg font-semibold text-text">{profile?.education || "Not specified"}</p>
            </div>
            <div className="rounded-[1.4rem] bg-surface-hover/70 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Top Skills</p>
              <p className="mt-2 text-lg font-semibold text-text">{profile?.skills.length ?? 0}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-text">Skill stack</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(profile?.skills ?? []).map((skill) => (
                <SkillPill key={skill} tone="success">
                  {skill}
                </SkillPill>
              ))}
              {!(profile?.skills?.length) ? (
                <p className="text-sm text-text-secondary">No skill data yet. Upload a parsed resume to populate this section.</p>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Market Signals</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Where to get stronger next</h2>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm font-semibold text-text">Skill gaps recruiters keep asking for</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(insights?.skill_gaps ?? []).slice(0, 8).map((skill) => (
                  <SkillPill key={skill} tone="warning">
                    {skill}
                  </SkillPill>
                ))}
                {!(insights?.skill_gaps?.length) ? (
                  <p className="text-sm text-text-secondary">Apply to a few jobs to generate clearer demand signals.</p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-text">Actionable advice</p>
              <div className="mt-3 space-y-3">
                {(insights?.career_tips ?? []).map((tip) => (
                  <div key={tip} className="rounded-[1.25rem] border border-border/70 bg-surface-hover/55 px-4 py-3 text-sm leading-6 text-text-secondary">
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Application History</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">How each submitted role stacked up</h2>
          </div>
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary-hover">
            Find more jobs
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon={HiOutlineChartBar}
            title="No submitted applications yet"
            description="Use the job board to preview your score and submit when the role looks promising."
          />
        ) : (
          <div className="mt-5 space-y-4">
            {matches.map((match) => (
              <Link
                key={`${match.job_id}-${match.resume_id}`}
                href={`/jobs/${match.job_id}`}
                className="block rounded-[1.5rem] border border-border/70 bg-surface-hover/40 p-5 transition hover:border-primary/25 hover:bg-surface-hover"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold tracking-[-0.04em] text-text">{match.job_title}</h3>
                      <SkillPill tone="info">{match.resume_label}</SkillPill>
                      <SkillPill tone="success">{match.status}</SkillPill>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{match.company}</p>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">{match.ai_explanation}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-primary/10 px-4 py-3 text-center">
                    <p className="text-3xl font-semibold tracking-[-0.05em] text-primary">{match.match_score}%</p>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">overall match</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-text">Matched skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.matched_skills.map((skill) => (
                        <SkillPill key={skill} tone="success">
                          {skill}
                        </SkillPill>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">Missing skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.missing_skills.map((skill) => (
                        <SkillPill key={skill} tone="warning">
                          {skill}
                        </SkillPill>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                  <span>Applied {formatDate(match.applied_at)}</span>
                  <span>Required skills: {match.breakdown.required_skill_score}%</span>
                  <span>Semantic fit: {match.breakdown.semantic_score}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
