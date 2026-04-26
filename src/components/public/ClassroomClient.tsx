"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, MessageCircle, Pin, Paperclip, CalendarDays, Settings2, Edit3 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider, useAuth } from "@/components/layout/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Chat from "@/components/public/Chat";
import {
  cn, formatPostTime, SOURCE_TAG_LABELS, SOURCE_TAG_STYLES, DATE_TYPE_STYLES,
} from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { College, Announcement, ImportantDate } from "@/types";

type Tab = "announcements" | "discussions";

type Props = {
  college: College;
  branch: string;
  year: number;
  section: string;
  initialAnnouncements: Announcement[];
  initialDates: ImportantDate[];
};

const CLASS_KEY = "studyly_classroom";

export default function ClassroomClient({
  college, branch, year, section,
  initialAnnouncements, initialDates,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("announcements");

  function handleChangeClass() {
    localStorage.removeItem(CLASS_KEY);
    router.push("/classroom");
  }

  const yearSuffix = ["st","nd","rd","th"][Math.min(year - 1, 3)];

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar />

        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">

          <main className="flex flex-col gap-0">
            <div className="card p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {college.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {branch} · {year}{yearSuffix} year · <span className="text-brand dark:text-brand-mid font-medium">Section {section}</span>
                </p>
              </div>
              <button
                onClick={handleChangeClass}
                className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <Settings2 size={13} />
                change class
              </button>
            </div>

            <div className="flex border-b border-black/8 dark:border-white/8 mb-4">
              {([
                { id: "announcements" as Tab, label: "announcements", icon: <Megaphone size={14} /> },
                { id: "discussions"   as Tab, label: "discussions",   icon: <MessageCircle size={14} /> },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 text-sm border-b-2 transition-all -mb-px",
                    tab === t.id
                      ? "border-brand dark:border-brand-mid text-brand dark:text-brand-mid font-medium"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "announcements" && (
              <div className="flex flex-col gap-3">
                <CRComposer
                  collegeId={college.id}
                  branch={branch}
                  year={year}
                  section={section}
                />
                {initialAnnouncements.length === 0 ? (
                  <div className="card p-10 text-center">
                    <Megaphone size={28} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 dark:text-gray-600">
                      No announcements yet for Section {section}.
                    </p>
                    <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">
                      Your CR will post announcements here.
                    </p>
                  </div>
                ) : (
                  initialAnnouncements.map((a) => (
                    <AnnouncementCard key={a.id} announcement={a} />
                  ))
                )}
              </div>
            )}

            {tab === "discussions" && (
              <div className="card overflow-hidden relative flex flex-col" style={{ height: "calc(100vh - 260px)", minHeight: "520px" }}>
                <Chat
                  collegeId={college.id}
                  branch={branch}
                  year={year}
                  section={section}
                />
              </div>
            )}
          </main>

          <aside className="flex flex-col gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={14} className="text-brand dark:text-brand-mid" />
                <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider">upcoming dates</p>
              </div>
              {initialDates.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-600">No upcoming dates.</p>
              ) : (
                initialDates.map((d) => (
                  <div key={d.id} className="flex gap-3 py-2.5 border-b border-black/8 dark:border-white/8 last:border-0 last:pb-0">
                    <div className="text-center w-9 flex-shrink-0">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none">
                        {format(parseISO(d.date), "d")}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-600 uppercase">
                        {format(parseISO(d.date), "MMM")}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{d.title}</p>
                      {d.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{d.description}</p>
                      )}
                      <span className={cn("tag mt-1", DATE_TYPE_STYLES[d.type])}>{d.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card p-4">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">about</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Announcements are posted by your CR or authorised announcers.
                Discussions are open to all students in Section {section} — no login needed.
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
        <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {a.is_pinned && (
            <span className="tag bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400">
              <Pin size={9} className="mr-0.5" />pinned
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

function CRComposer({
  collegeId, branch, year, section,
}: {
  collegeId: string;
  branch: string;
  year: number;
  section: string;
}) {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const isCR = profile?.role === "cr" &&
    profile.college_id === collegeId &&
    profile.branch === branch &&
    profile.year === year &&
    profile.section === section;

  const isAnnouncer = profile?.role === "announcer" &&
    profile.college_id === collegeId &&
    profile.branch === branch &&
    profile.year === year &&
    profile.section === section;

  const SOURCE_TAGS = ["Principal", "Dean", "College"];
  const TAG_STYLES: Record<string, string> = {
    Principal: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-300",
    Dean: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300",
    College: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300",
  };

  async function handlePost() {
    if (!body.trim() || !profile) return;
    setPosting(true);
    await supabase.from("announcements").insert({
      college_id: collegeId,
      branch,
      year,
      section,
      author_id: profile.id,
      body: body.trim(),
      source_tag: activeTag?.toLowerCase() ?? (isCR ? "cr" : "announcer"),
    });
    setPosting(false);
    setBody("");
    setActiveTag(null);
    router.refresh();
  }

  if (!isCR && !isAnnouncer) return null;

  return (
    <div className="card p-4 border-brand-mid dark:border-brand-mid">
      <h4 className="flex items-center gap-2 text-xs font-medium text-brand dark:text-brand-mid mb-3">
        <Edit3 size={13} />
        post to section {section}
        {isAnnouncer && (
          <span className="text-gray-400 dark:text-gray-600 font-normal">· as announcer</span>
        )}
      </h4>
      <textarea
        className="input resize-none min-h-[68px] text-sm w-full"
        placeholder="Share an announcement with your section…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-600">tag source:</span>
          {SOURCE_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                activeTag === t
                  ? TAG_STYLES[t]
                  : "border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={handlePost}
          disabled={posting || !body.trim()}
          className="btn-primary px-5 py-1.5 text-sm"
        >
          {posting ? "posting…" : "post"}
        </button>
      </div>
    </div>
  );
}
