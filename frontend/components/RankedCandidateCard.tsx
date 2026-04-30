"use client";

interface ScoreBarProps {
    label: string;
    value: number;
    color?: string;
}

export function ScoreBar({ label, value, color = "bg-primary" }: ScoreBarProps) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary text-xs">{label}</span>
                <span className="font-semibold text-text text-xs">{value}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
        </div>
    );
}

interface RankedCandidateCardProps {
    rank: number;
    name: string;
    email: string;
    matchScore: number;
    skillMatchPercent: number;
    matchedSkills: string[];
    missingSkills: string[];
    experience: number;
    education: string;
}

export default function RankedCandidateCard({
    rank,
    name,
    email,
    matchScore,
    skillMatchPercent,
    matchedSkills,
    missingSkills,
    experience,
    education,
}: RankedCandidateCardProps) {
    const scoreColor =
        matchScore >= 70 ? "text-primary" : matchScore >= 40 ? "text-accent" : "text-warn";
    const scoreBg =
        matchScore >= 70 ? "bg-primary-soft" : matchScore >= 40 ? "bg-accent-soft" : "bg-warn-soft";
    const rankBg = rank <= 3 ? "bg-primary text-text-inverse" : "bg-surface-hover text-text-muted";

    return (
        <div className="animate-fade-in rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex items-start gap-3.5">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${rankBg}`}>
                        {rank}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-text">{name}</h3>
                        <p className="mt-0.5 text-xs text-text-muted">{email}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-text-muted">
                            <span className="rounded-md bg-surface-hover px-1.5 py-0.5">{experience} yrs</span>
                            <span className="rounded-md bg-surface-hover px-1.5 py-0.5">{education}</span>
                        </div>
                    </div>
                </div>

                {/* Score */}
                <div className={`flex flex-col items-center rounded-xl ${scoreBg} px-3.5 py-2 min-w-[56px]`}>
                    <span className={`text-xl font-bold leading-none ${scoreColor}`}>{matchScore}</span>
                    <span className="text-[9px] font-medium text-text-muted uppercase tracking-wider mt-0.5">match</span>
                </div>
            </div>

            {/* Score Bar */}
            <div className="mt-4">
                <ScoreBar label="Skill Match" value={skillMatchPercent} color="bg-primary" />
            </div>

            {/* Skills */}
            {(matchedSkills.length > 0 || missingSkills.length > 0) && (
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {matchedSkills.map((s) => (
                        <span key={s} className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                            {s}
                        </span>
                    ))}
                    {missingSkills.slice(0, 3).map((s) => (
                        <span key={s} className="rounded-md bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn">
                            {s}
                        </span>
                    ))}
                    {missingSkills.length > 3 && (
                        <span className="rounded-md bg-surface-hover px-2 py-0.5 text-[11px] text-text-muted">
                            +{missingSkills.length - 3}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
