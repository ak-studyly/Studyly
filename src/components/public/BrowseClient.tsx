"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Download, Pin, Paperclip } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/layout/AuthProvider";
import {
  cn, formatPostTime, MATERIAL_TYPE_LABELS, MATERIAL_TYPE_STYLES,
  SOURCE_TAG_LABELS, SOURCE_TAG_STYLES, DATE_TYPE_STYLES, SECTIONS,
} from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { College, Material, Announcement, ImportantDate } from "@/types";

type Props = {
  college: College;
  branch: string;
  year: number;
  section: string | null;
  initialMaterials: Material[];
  initialAnnouncements: Announcement[];
  initialDates: ImportantDate[];
};

type Tab = "all" | "materials" | "announcements";

export default function BrowseClient({
  college, branch, year, section,
  initialMaterials, initialAnnouncements, initialDates,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [selectedSection, setSelectedSection] = useState(section ?? "");

  function handleSectionChange(s: string) {
    setSelectedSection(s);
    const base = `/${college.name.toLowerCase().replace(/\s+/g, "-")}/${branch.toLowerCase().replace(/\s+/g, "-")}/${year}`;
    const params = new URLSearchParams();
    if (s) params.set("section", s);
    router.push(`/browse${base}${params.toString() ? "?" + params.toString() : ""}`);
  }

  const showAnnouncements = !!section;

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar />

        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr_240px] gap-5">

          {/* Left sidebar */}
          <aside className="flex flex-col gap-4">
            <div className="card p-4">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">browsing</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{college.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{branch} · {year}{["st","nd","rd","th"][Math.min(year-1,3)]} year</p>

              <div className="mt-4">
                <label className="text-xs font-medium text-gray-400 dark:text-gray-600 block mb-1.5">section</label>
                <select
                  className="select text-sm"
                  value={selectedSection}
                  onChange={(e) => handleSectionChange(e.target.value)}
                >
                  <option value="">no section selected</option>
                  {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                </select>
                {!section && (
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 leading-relaxed">
                    Select a section to see announcements and important dates from your CR.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => router.push("/upload")}
              className="btn-primary text-center"
            >
              upload material
            </button>
          </aside>

          {/* Main feed */}
          <main className="flex flex-col gap-4">
            {/* Header + tabs */}
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">
                {branch} · {year}{["st","nd","rd","th"][Math.min(year-1,3)]} year
                {section && <span className="text-base font-normal text-gray-400 dark:text-gray-600"> · Section {section}</span>}
              </h1>
              <div className="flex gap-1.5">
                {(["all", "materials", "announcements"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all",
                      tab === t
                        ? "bg-brand border-brand text-white font-medium"
                        : "border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Announcements */}
            {showAnnouncements && (tab === "all" || tab === "announcements") && (
              <>
                <div className="section-divider">announcements</div>
                {initialAnnouncements.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-gray-400 dark:text-gray-600">
                    No announcements yet for Section {section}.
                  </div>
                ) : (
                  initialAnnouncements.map((a) => (
                    <AnnouncementCard key={a.id} announcement={a} />
                  ))
                )}
              </>
            )}

            {/* Materials */}
            {(tab === "all" || tab === "materials") && (
              <>
                <div className="section-divider">materials</div>
                {initialMaterials.length === 0 ? (
                  <div className="card p-6 text-center text-sm text-gray-400 dark:text-gray-600">
                    No materials uploaded yet. Be the first!
                  </div>
                ) : (
                  initialMaterials.map((m) => (
                    <MaterialCard key={m.id} material={m} />
                  ))
                )}
              </>
            )}

            {!showAnnouncements && tab === "announcements" && (
              <div className="card p-6 text-center text-sm text-gray-400 dark:text-gray-600">
                Select a section from the sidebar to view announcements.
              </div>
            )}
          </main>

          {/* Right panel */}
          <aside className="flex flex-col gap-4">
            {showAnnouncements && initialDates.length > 0 && (
              <div className="card p-4">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">upcoming dates</p>
                <div className="flex flex-col gap-0">
                  {initialDates.map((d) => (
                    <div key={d.id} className="flex gap-3 py-2.5 border-b border-black/8 dark:border-white/8 last:border-0 last:pb-0">
                      <div className="text-center w-9 flex-shrink-0">
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-none">
                          {format(parseISO(d.date), "d")}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-600 uppercase">
                          {format(parseISO(d.date), "MMM")}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.title}</p>
                        {d.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{d.description}</p>}
                        <span className={cn("tag mt-1", DATE_TYPE_STYLES[d.type])}>{d.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-4">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">about this page</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Materials on this page are shared by students and reviewed by the community. Upvote what helps you.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </AuthProvider>
  );
}

function AnnouncementCard({ announcement: a }: { announcement: Announcement }) {
  return (
    <div className={cn("card p-4", a.is_pinned && "border-brand-mid dark:border-brand-mid")}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
            a.author?.role === "cr"
              ? "bg-brand-light dark:bg-green-950 text-brand dark:text-brand-mid"
              : "bg-accent-light dark:bg-orange-950 text-accent dark:text-orange-300"
          )}>
            {(a.author?.full_name ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {a.author?.full_name ?? "Unknown"}
              <span className="text-xs font-normal text-gray-400 dark:text-gray-600 ml-1">
                · {a.author?.role ?? "announcer"}
              </span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">{formatPostTime(a.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {a.is_pinned && (
            <span className="tag bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400">
              <Pin size={9} /> pinned
            </span>
          )}
          <span className={cn("tag", SOURCE_TAG_STYLES[a.source_tag])}>
            {SOURCE_TAG_LABELS[a.source_tag]}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{a.body}</p>
      {a.attachment_url && (
        <a
          href={a.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand dark:text-brand-mid bg-brand-light dark:bg-green-950 px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
        >
          <Paperclip size={11} />
          {a.attachment_name ?? "attachment"}
        </a>
      )}
    </div>
  );
}

function MaterialCard({ material: m }: { material: Material }) {
  return (
    <div className="card p-4 flex items-center gap-3 hover:border-brand-mid dark:hover:border-brand-mid transition-colors cursor-pointer">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("tag", MATERIAL_TYPE_STYLES[m.type])}>
            {MATERIAL_TYPE_LABELS[m.type]}
          </span>
          {m.subject && (
            <span className="text-xs text-gray-400 dark:text-gray-600">{m.subject}</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-600">
          by {m.uploader_name} · {formatPostTime(m.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-mid">
          <Star size={12} fill="currentColor" /> {m.upvotes}
        </span>
        <a
          href={m.file_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 dark:text-gray-600 transition-colors"
        >
          <Download size={15} />
        </a>
      </div>
    </div>
  );
}
