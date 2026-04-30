"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { HiOutlineEnvelope, HiOutlineLockClosed } from "react-icons/hi2";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading, error, clearError } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
            router.push("/dashboard");
        } catch {
            // Error is set in store
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            {/* Ambient */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/3 top-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.06] blur-[100px]" />
                <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-accent/[0.04] blur-[80px]" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="mb-10 text-center">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-extrabold text-text-inverse">
                            IQ
                        </div>
                        <span className="text-lg font-semibold tracking-tight">
                            Resume<span className="text-primary">IQ</span>
                        </span>
                    </Link>
                    <p className="mt-2 text-sm text-text-muted">Welcome back</p>
                </div>

                {/* Form Card */}
                <form
                    onSubmit={handleSubmit}
                    className="animate-fade-in rounded-2xl border border-border bg-surface p-7"
                >
                    {error && (
                        <div className="mb-5 rounded-xl bg-warn-soft border border-warn/15 px-4 py-3 text-sm text-warn flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={clearError} className="text-warn/50 hover:text-warn ml-2">✕</button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Email</label>
                            <div className="relative">
                                <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@company.com"
                                    className="w-full rounded-xl border border-border bg-bg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 transition-colors focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-muted">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full rounded-xl border border-border bg-bg pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 transition-colors focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-text-inverse transition-all hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-text-inverse border-t-transparent" />
                                Signing in…
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    <p className="mt-5 text-center text-[13px] text-text-muted">
                        No account?{" "}
                        <Link href="/register" className="font-medium text-primary hover:text-primary-hover transition-colors">
                            Create one
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
