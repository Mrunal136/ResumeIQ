"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <div className="min-h-screen bg-bg">
            <div className="pointer-events-none fixed inset-0 -z-10 soft-grid opacity-35" />
            <Navbar />
            <main className="mx-auto max-w-7xl px-6 py-8">
                {children}
            </main>
        </div>
    );
}
