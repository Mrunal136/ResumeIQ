"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HiOutlineBriefcase, HiOutlineHome, HiOutlineArrowRightOnRectangle, HiOutlineArrowUpTray, HiOutlineUser } from "react-icons/hi2";

const recruiterItems = [
    { href: "/dashboard", label: "Overview", icon: HiOutlineHome },
    { href: "/dashboard/jobs/new", label: "Create Job", icon: HiOutlineArrowUpTray },
    { href: "/jobs", label: "Jobs", icon: HiOutlineBriefcase },
];

const candidateItems = [
    { href: "/dashboard", label: "Overview", icon: HiOutlineHome },
    { href: "/jobs", label: "Job Board", icon: HiOutlineBriefcase },
    { href: "/profile", label: "My Profile", icon: HiOutlineUser },
    { href: "/dashboard/upload", label: "My Resumes", icon: HiOutlineArrowUpTray },
];

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const navItems = user?.role === "candidate" ? candidateItems : recruiterItems;

    return (
        <header className="glass sticky top-0 z-50 border-b border-border/50">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href={user?.role === "candidate" ? "/dashboard" : "/dashboard"} className="group flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-xs font-extrabold text-text-inverse tracking-wide transition-transform group-hover:scale-105">
                        IQ
                    </div>
                    <div>
                        <span className="block text-base font-semibold tracking-tight">
                            Resume<span className="text-primary">IQ</span>
                        </span>
                        <span className="block text-[11px] uppercase tracking-[0.24em] text-text-muted">
                            {user?.role === "candidate" ? "Candidate Workspace" : "Recruiter Workspace"}
                        </span>
                    </div>
                </Link>

                <nav className="hidden items-center gap-1 rounded-full border border-border/80 bg-surface/80 px-2 py-1 md:flex">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${isActive
                                    ? "bg-primary text-text-inverse shadow-[0_10px_30px_rgba(15,118,110,0.22)]"
                                    : "text-text-muted hover:bg-surface-hover hover:text-text"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    {user && (
                        <div className="hidden items-center gap-3 rounded-full border border-border/80 bg-surface/75 px-4 py-2 sm:flex">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="leading-tight">
                                <p className="text-sm font-semibold text-text">{user.name}</p>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">{user.role}</p>
                            </div>
                        </div>
                    )}
                    <ThemeToggle />
                    <button
                        onClick={() => logout()}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-surface/80 text-text-muted transition-colors hover:border-warm/30 hover:bg-warm/10 hover:text-warm"
                        title="Logout"
                    >
                        <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
