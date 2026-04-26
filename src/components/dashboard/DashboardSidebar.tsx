"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Megaphone, BookOpen, CalendarDays,
  Users, CalendarPlus, Activity, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

type Props = { profile: Profile };

const NAV = [
  { href: "/dashboard",               label: "dashboard",        icon: LayoutDashboard },
  { href: "/dashboard/announcements", label: "announcements",    icon: Megaphone },
  { href: "/dashboard/discussions",   label: "discussions",      icon: MessageCircle },
  { href: "/dashboard/materials",     label: "materials",        icon: BookOpen },
  { href: "/dashboard/dates",         label: "important dates",  icon: CalendarDays },
];

const CR_NAV = [
  { href: "/dashboard/manage-announcers", label: "manage announcers", icon: Users },
  { href: "/dashboard/add-date",          label: "add important date", icon: CalendarPlus },
  { href: "/dashboard/activity",          label: "section activity",   icon: Activity },
];

export default function DashboardSidebar({ profile }: Props) {
  const pathname = usePathname();
  const isCR = profile.role === "cr";

  return (
    <aside className="flex flex-col gap-3">
      <div className="card p-4">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">my class</p>
        <div className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{profile.full_name ?? profile.email}</p>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            {isCR ? "Class Representative" : "Announcer"}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-1.5 bg-brand-light dark:bg-green-950 text-brand dark:text-brand-mid text-xs font-medium px-3 py-1.5 rounded-full w-fit">
          Section {profile.section}
        </div>
        <div className="mt-3 pt-3 border-t border-black/8 dark:border-white/8 flex flex-col gap-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                  active
                    ? "text-brand dark:text-brand-mid font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-800"
                )}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {isCR && (
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">cr tools</p>
          <div className="flex flex-col gap-0.5">
            {CR_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                    active
                      ? "text-brand dark:text-brand-mid font-medium"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  )}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
