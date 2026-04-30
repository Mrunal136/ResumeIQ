"use client";

import { HiOutlineTrash } from "react-icons/hi2";

interface Resume {
    id: string;
    name: string;
    email: string;
    skills: string[];
    experience_years: number;
    education: string;
    created_at?: string;
}

interface CandidateTableProps {
    resumes: Resume[];
    onDelete?: (id: string) => void;
    showDelete?: boolean;
}

export default function CandidateTable({ resumes, onDelete, showDelete = true }: CandidateTableProps) {
    if (resumes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-text-muted">
                <svg className="mb-3 h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium">No resumes yet</p>
                <p className="mt-1 text-xs opacity-60">Upload resumes to see them here</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border bg-surface">
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Candidate</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Skills</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Exp.</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Education</th>
                        {showDelete && <th className="px-5 py-3 w-12" />}
                    </tr>
                </thead>
                <tbody>
                    {resumes.map((r, i) => (
                        <tr
                            key={r.id}
                            className={`border-b border-border/40 transition-colors hover:bg-surface-hover ${i % 2 === 0 ? "bg-surface/40" : ""
                                }`}
                        >
                            <td className="px-5 py-3.5">
                                <p className="text-[13px] font-medium text-text">{r.name}</p>
                                <p className="mt-0.5 text-xs text-text-muted">{r.email}</p>
                            </td>
                            <td className="px-5 py-3.5">
                                <div className="flex flex-wrap gap-1">
                                    {r.skills.slice(0, 3).map((s) => (
                                        <span key={s} className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-primary">
                                            {s}
                                        </span>
                                    ))}
                                    {r.skills.length > 3 && (
                                        <span className="rounded-md bg-surface-hover px-1.5 py-0.5 text-[11px] text-text-muted">
                                            +{r.skills.length - 3}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] text-text-secondary">{r.experience_years}y</td>
                            <td className="px-5 py-3.5 text-[13px] text-text-muted">{r.education}</td>
                            {showDelete && onDelete && (
                                <td className="px-5 py-3.5">
                                    <button
                                        onClick={() => onDelete(r.id)}
                                        className="rounded-lg p-1 text-text-muted transition-colors hover:bg-warn-soft hover:text-warn"
                                    >
                                        <HiOutlineTrash className="h-3.5 w-3.5" />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
