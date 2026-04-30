"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HiOutlineDocumentText, HiOutlineBolt, HiOutlineChartBar, HiOutlineShieldCheck, HiArrowRight } from "react-icons/hi2";

const features = [
  {
    icon: HiOutlineDocumentText,
    title: "Smart Parsing",
    desc: "Extract skills, experience, and qualifications automatically from PDF and DOCX resumes.",
    tag: "Upload",
  },
  {
    icon: HiOutlineBolt,
    title: "AI Ranking",
    desc: "Rank candidates using semantic vector embeddings and intelligent matching algorithms.",
    tag: "Core",
  },
  {
    icon: HiOutlineChartBar,
    title: "Score Insights",
    desc: "Get detailed breakdown scores and actionable improvement suggestions for every resume.",
    tag: "Analytics",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Enterprise Auth",
    desc: "JWT authentication with HTTP-only cookies, role-based access control, and secure sessions.",
    tag: "Security",
  },
];

const stats = [
  { value: "384+", label: "Vector Dimensions" },
  { value: "<2s", label: "Avg. Ranking Time" },
  { value: "99.5%", label: "Parsing Accuracy" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-accent/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-primary/[0.04] blur-[80px]" />
      </div>

      {/* ── Header ──────────────────────────── */}
      <header className="glass sticky top-0 z-50 border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-extrabold text-text-inverse tracking-wide transition-transform group-hover:scale-105">
              IQ
            </div>
            <span className="text-base font-semibold tracking-tight">
              Resume<span className="text-primary">IQ</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-text-inverse transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center pb-20 pt-24 text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium text-primary tracking-wide">AI-Powered Resume Screening</span>
          </div>

          {/* Heading */}
          <h1 className="animate-slide-up max-w-2xl text-[3.25rem] font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
            Screen Smarter.{" "}
            <span className="text-primary">Hire Faster.</span>
          </h1>

          <p className="animate-slide-up mt-6 max-w-lg text-base leading-relaxed text-text-secondary" style={{ animationDelay: "0.1s" }}>
            Upload resumes, match against job descriptions, and instantly surface top candidates
            with AI-powered semantic analysis.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up mt-10 flex items-center gap-3" style={{ animationDelay: "0.2s" }}>
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-text-inverse shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30"
            >
              Start Free
              <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary transition-all hover:border-border-light hover:text-text"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-slide-up mt-16 flex items-center gap-8 rounded-2xl border border-border bg-surface px-8 py-4" style={{ animationDelay: "0.3s" }}>
            {stats.map((s, i) => (
              <div key={i} className={`flex flex-col items-center ${i > 0 ? "border-l border-border pl-8" : ""}`}>
                <span className="text-xl font-bold text-primary">{s.value}</span>
                <span className="mt-0.5 text-xs text-text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────── */}
        <section className="pb-28">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Features</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Everything you need to hire better</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5"
              >
                {/* Tag */}
                <span className="absolute right-4 top-4 rounded-md bg-surface-hover px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  {f.tag}
                </span>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-text-inverse">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-border py-6 text-center text-xs text-text-muted">
        © 2026 ResumeIQ — Built with Next.js, FastAPI & AI
      </footer>
    </div>
  );
}
