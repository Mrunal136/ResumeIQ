"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineCheck,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";

import { EmptyState, PageIntro, SectionCard, SkillPill } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { useResumeStore } from "@/stores/resumeStore";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string | null) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function UploadPage() {
  const { user, checkAuth } = useAuthStore();
  const {
    resumes,
    fetchResumes,
    uploadResume,
    deleteResume,
    setDefaultResume,
    isLoading,
    error,
    clearError,
  } = useResumeStore();

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user?.role === "candidate") {
      fetchResumes();
    }
  }, [user, fetchResumes]);

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      clearError();
      setSuccessMessage("");
    }
  }, [clearError]);

  const handleUpload = async () => {
    if (!file) return;
    try {
      const uploaded = await uploadResume(file);
      setFile(null);
      setSuccessMessage(`${uploaded.label} is ready. You can now reuse it across job applications.`);
    } catch {
      // Store error is shown in the page.
    }
  };

  if (user?.role && user.role !== "candidate") {
    return (
      <EmptyState
        icon={HiOutlineDocumentText}
        title="Resume uploads are managed from the candidate side"
        description="Recruiters can create jobs and review applicants, but only candidates keep personal reusable resumes in this workspace."
        action={
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover"
          >
            Go to Jobs
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageIntro
        eyebrow="Resume Library"
        title="Upload once, reuse everywhere."
        description="Your default resume is used automatically when you preview or apply to a job. You can still upload a new version whenever you want."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">New Upload</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Add a resume</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            PDF and DOCX files are parsed automatically for skills, experience, and education details.
          </p>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`mt-6 rounded-[1.75rem] border-2 border-dashed p-8 transition ${dragActive
              ? "border-primary bg-primary/8"
              : "border-border bg-surface-hover/35 hover:border-primary/25"
              }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-3xl ${dragActive ? "bg-primary text-text-inverse" : "bg-primary/10 text-primary"}`}>
                <HiOutlineCloudArrowUp className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-text">Drop your resume here</h3>
              <p className="mt-2 text-sm text-text-secondary">Or choose a file from your machine. Maximum size is 5 MB.</p>
              <label className="mt-5 inline-flex cursor-pointer items-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text transition hover:border-primary/30">
                Choose File
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected) {
                      setFile(selected);
                      clearError();
                      setSuccessMessage("");
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {file ? (
            <div className="mt-4 flex items-center justify-between rounded-[1.4rem] border border-border/70 bg-surface-hover/60 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HiOutlineDocumentText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{file.name}</p>
                  <p className="text-xs text-text-secondary">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition hover:border-warm/30 hover:bg-warm/10 hover:text-warm"
              >
                <HiOutlineXMark className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[1.4rem] border border-warm/20 bg-warm/10 px-4 py-4 text-sm text-warm">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 flex items-start gap-3 rounded-[1.4rem] border border-primary/20 bg-primary/10 px-4 py-4 text-sm text-primary">
              <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : null}

          <button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text-inverse transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLoading ? "Processing resume..." : "Upload and Analyze"}
          </button>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Saved Resumes</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Your reusable versions</h2>
            </div>
            <SkillPill tone="info">{resumes.length} saved</SkillPill>
          </div>

          {resumes.length === 0 ? (
            <EmptyState
              icon={HiOutlineSparkles}
              title="Nothing uploaded yet"
              description="Once you upload a resume, it becomes available in job matching and you can switch the default version any time."
            />
          ) : (
            <div className="mt-5 space-y-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="rounded-[1.5rem] border border-border/70 bg-surface-hover/45 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-text">{resume.label}</h3>
                        {resume.is_default ? <SkillPill tone="success">Default</SkillPill> : null}
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">
                        {resume.filename} · Updated {formatDate(resume.created_at)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {resume.skills.slice(0, 8).map((skill) => (
                          <SkillPill key={skill} tone="neutral">
                            {skill}
                          </SkillPill>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!resume.is_default ? (
                        <button
                          onClick={() => setDefaultResume(resume.id)}
                          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary/30 hover:text-text"
                        >
                          Make Default
                        </button>
                      ) : null}
                      <button
                        onClick={() => deleteResume(resume.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-warm/30 hover:bg-warm/10 hover:text-warm"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-surface px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Candidate Name</p>
                      <p className="mt-2 text-sm font-semibold text-text">{resume.name}</p>
                    </div>
                    <div className="rounded-2xl bg-surface px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Experience</p>
                      <p className="mt-2 text-sm font-semibold text-text">{resume.experience_years} years</p>
                    </div>
                    <div className="rounded-2xl bg-surface px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Education</p>
                      <p className="mt-2 text-sm font-semibold text-text">{resume.education}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
