"use client";

import { useState } from "react";
import { useRankingStore } from "@/stores/rankingStore";
import RankedCandidateCard from "@/components/RankedCandidateCard";
import ScoreChart from "@/components/ScoreChart";
import { HiOutlineBolt } from "react-icons/hi2";

export default function RankingPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [skills, setSkills] = useState("");
    const [minExp, setMinExp] = useState("0");
    const [topN, setTopN] = useState("10");

    const { candidates, jobTitle, isLoading, error, rankCandidates, clearRankings } = useRankingStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await rankCandidates({
            title,
            description,
            required_skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
            min_experience: parseInt(minExp) || 0,
            top_n: parseInt(topN) || 10,
        });
    };

    const chartData = candidates.map((c) => ({
        name: c.name.split(" ")[0],
        score: c.match_score,
    }));

    const inputCls = "w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 transition-colors focus:border-primary focus:outline-none";
    const labelCls = "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-text-muted";

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-xl font-bold tracking-tight">Rank Candidates</h1>
                <p className="mt-0.5 text-sm text-text-muted">
                    Match resumes against a job description
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Form */}
                <div className="lg:col-span-2">
                    <form
                        onSubmit={handleSubmit}
                        className="sticky top-20 space-y-4 rounded-2xl border border-border bg-surface p-5"
                    >
                        <div>
                            <label className={labelCls}>Job Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="Senior Frontend Developer"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={4}
                                placeholder="Describe the ideal candidate…"
                                className={`${inputCls} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Required Skills</label>
                            <input
                                type="text"
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                                placeholder="React, TypeScript, Node.js"
                                className={inputCls}
                            />
                            <p className="mt-1 text-[10px] text-text-muted">Comma-separated</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className={labelCls}>Min Exp</label>
                                <input
                                    type="number"
                                    value={minExp}
                                    onChange={(e) => setMinExp(e.target.value)}
                                    min="0"
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Top N</label>
                                <input
                                    type="number"
                                    value={topN}
                                    onChange={(e) => setTopN(e.target.value)}
                                    min="1"
                                    max="50"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-text-inverse transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 disabled:opacity-40"
                        >
                            {isLoading ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-text-inverse border-t-transparent" />
                                    Analyzing…
                                </>
                            ) : (
                                <>
                                    <HiOutlineBolt className="h-4 w-4" />
                                    Rank Candidates
                                </>
                            )}
                        </button>

                        {candidates.length > 0 && (
                            <button
                                type="button"
                                onClick={clearRankings}
                                className="w-full rounded-xl border border-border py-2 text-[13px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
                            >
                                Clear
                            </button>
                        )}
                    </form>
                </div>

                {/* Results */}
                <div className="lg:col-span-3 space-y-5">
                    {error && (
                        <div className="rounded-xl bg-warn-soft border border-warn/15 px-4 py-3 text-sm text-warn">
                            {error}
                        </div>
                    )}

                    {candidates.length > 0 && (
                        <>
                            <div>
                                <h2 className="text-base font-semibold">{jobTitle}</h2>
                                <p className="text-xs text-text-muted">{candidates.length} candidates ranked</p>
                            </div>

                            <ScoreChart data={chartData} />

                            <div className="space-y-3">
                                {candidates.map((c, i) => (
                                    <RankedCandidateCard
                                        key={c.id}
                                        rank={i + 1}
                                        name={c.name}
                                        email={c.email}
                                        matchScore={c.match_score}
                                        skillMatchPercent={c.skill_match_percent}
                                        matchedSkills={c.matched_skills}
                                        missingSkills={c.missing_skills}
                                        experience={c.experience_years}
                                        education={c.education}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {!isLoading && candidates.length === 0 && !error && (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                                <HiOutlineBolt className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-sm font-medium">No rankings yet</h3>
                            <p className="mt-1 max-w-xs text-xs text-text-muted">
                                Enter a job description and click Rank Candidates
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
