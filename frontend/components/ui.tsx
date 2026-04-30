"use client";

import clsx from "clsx";
import type { IconType } from "react-icons";

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-surface/90 p-6 shadow-[0_20px_80px_rgba(7,36,36,0.08)] sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-text sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-[1.75rem] border border-border/70 bg-surface/90 p-5 shadow-[0_18px_60px_rgba(7,36,36,0.06)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "primary",
}: {
  icon: IconType;
  label: string;
  value: string | number;
  detail?: string;
  tone?: "primary" | "accent" | "warm" | "info";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    warm: "bg-warm/10 text-warm",
    info: "bg-info/10 text-info",
  };

  return (
    <SectionCard className="flex items-start gap-4 p-5">
      <div className={clsx("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-muted">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">{value}</p>
        {detail ? <p className="mt-1 text-sm text-text-secondary">{detail}</p> : null}
      </div>
    </SectionCard>
  );
}

export function SkillPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  const toneClasses = {
    neutral: "bg-surface-hover text-text-secondary border-border/70",
    success: "bg-primary/10 text-primary border-primary/15",
    warning: "bg-warm/12 text-warm border-warm/20",
    info: "bg-info/10 text-info border-info/15",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: IconType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <SectionCard className="flex flex-col items-center justify-center py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-text">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </SectionCard>
  );
}
