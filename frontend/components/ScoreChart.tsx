"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ScoreChartProps {
    data: { name: string; score: number }[];
}

const COLORS = ["#10B981", "#F59E0B", "#38BDF8", "#EF4444", "#059669", "#D97706"];

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5 shadow-2xl">
                <p className="text-xs text-text-secondary">{label}</p>
                <p className="mt-0.5 text-base font-bold text-primary">{payload[0].value}%</p>
            </div>
        );
    }
    return null;
};

export default function ScoreChart({ data }: ScoreChartProps) {
    if (!data || data.length === 0) return null;

    return (
        <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-5 text-sm font-semibold text-text">Candidate Match Scores</h3>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <XAxis
                        dataKey="name"
                        tick={{ fill: "#94A3B8", fontSize: 11 }}
                        axisLine={{ stroke: "#2D3548" }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: "#94A3B8", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16, 185, 129, 0.04)" }} />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={36}>
                        {data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
