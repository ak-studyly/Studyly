"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { User, LogIn, LogOut, Settings, Users, Moon, Sun } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import SignInModal from "@/components/ui/SignInModal";

type NavTab = { label: string; href: string };

const GUEST_TABS: NavTab[] = [
  { label: "materials",  href: "/materials" },
  { label: "classroom",  href: "/classroom" },
];

const DASHBOARD_TABS: NavTab[] = [
  { label: "dashboard", href: "/dashboard" },
  { label: "materials",  href: "/dashboard/materials" },
  { label: "announcements", href: "/dashboard/announcements" },
];

export default function Navbar({ section }: { section?: string }) {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [ddOpen, setDdOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!user;
  const tabs = isLoggedIn ? DASHBOARD_TABS : GUEST_TABS;

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setDdOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <>
      <nav className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-black/10 dark:border-white/8 flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <Link href="/" className="font-serif text-xl font-semibold text-brand dark:text-brand-mid tracking-tight">
          Study<span className="text-accent italic">ly</span>
        </Link>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "text-sm px-4 py-1.5 rounded-full transition-colors",
                pathname === t.href
                  ? "bg-brand-light dark:bg-green-950 text-brand dark:text-brand-mid font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Right — profile */}
        <div className="relative" ref={ddRef}>
          <button
            onClick={() => setDdOpen((o) => !o)}
            className={cn(
              "w-9 h-9 rounded-full border flex items-center justify-center text-sm font-medium transition-colors",
              isLoggedIn
                ? profile?.role === "cr"
                  ? "bg-brand-light dark:bg-green-950 border-brand-mid text-brand dark:text-brand-mid"
                  : profile?.role === "announcer"
                    ? "bg-accent-light dark:bg-orange-950 border-accent text-accent"
                    : "bg-gray-100 dark:bg-neutral-800 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400"
                : "bg-gray-100 dark:bg-neutral-800 border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400"
            )}
          >
            {isLoggedIn ? initials : <User size={16} />}
          </button>

          {/* Dropdown */}
          {ddOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-56 card shadow-lg overflow-hidden flex flex-col z-50">
              {/* Header */}
              <div className="px-4 py-3 border-b border-black/8 dark:border-white/8">
                {isLoggedIn ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {profile?.full_name ?? profile?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {profile?.role
                        ? `${profile.role.toUpperCase()} · Section ${profile.section}`
                        : "student"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      browsing as guest
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      no sign-in needed to view content
                    </p>
                  </>
                )}
              </div>

              {/* Items */}
              {isLoggedIn && (
                <>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setDdOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Settings size={14} className="text-gray-400" />
                    profile settings
                  </Link>
                  {profile?.role === "cr" && (
                    <Link
                      href="/dashboard/manage-announcers"
                      onClick={() => setDdOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Users size={14} className="text-gray-400" />
                      manage announcers
                    </Link>
                  )}
                </>
              )}

              {/* Dark mode toggle */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-black/8 dark:border-white/8">
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  {isDark ? <Moon size={14} className="text-gray-400" /> : <Sun size={14} className="text-gray-400" />}
                  dark mode
                </div>
                <button
                  onClick={toggleTheme}
                  className={cn(
                    "w-9 h-5 rounded-full relative transition-colors",
                    isDark ? "bg-brand dark:bg-brand-mid" : "bg-gray-300 dark:bg-neutral-600"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                    isDark ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Sign in / out */}
              <div className="border-t border-black/8 dark:border-white/8">
                {isLoggedIn ? (
                  <button
                    onClick={async () => { setDdOpen(false); await signOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <LogOut size={14} />
                    sign out
                  </button>
                ) : (
                  <button
                    onClick={() => { setDdOpen(false); setSignInOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand dark:text-brand-mid bg-brand-light dark:bg-green-950 hover:opacity-90 transition-opacity"
                  >
                    <LogIn size={14} />
                    CR or announcer? sign in
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
