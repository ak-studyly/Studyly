"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pin, Paperclip, Star, Download, Edit3, Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  cn, formatPostTime, SOURCE_TAG_LABELS, SOURCE_TAG_STYLES,
  MATERIAL_TYPE_LABELS, MATERIAL_TYPE_STYLES, DATE_TYPE_STYLES,
} from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { Profile, Announcement, Material, ImportantDate, SourceTag } from "@/types";
import Link from "next/link";

type Stats = { members: number; announcers: number; materials: number };

type Props = {
  profile: Profile;
  announcements: Announcement[];
  materials: Material[];
  dates: ImportantDate[];
  stats: Stats;
};

const SOURCE_TAGS: SourceTag[] = ["principal", "dean", "college"];

export default function DashboardFeed({ profile, announcements, materials, dates, stats }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isCR = profile.role === "cr";

  const [body, setBody] = useState("");
  const [activeTag, setActiveTag] = useState<SourceTag | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>(announcements);
  const [tab, setTab] = useState<"all" | "announcement" | "material">("all");

  async function handlePost() {
    if (!body.trim()) return;
    setPosting(true);
    setPostError(null);

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        college_id: profile.college_id,
        branch: profile.branch,
        year: profile.year,
        section: profile.section,
        author_id: profile.id,
        body: body.trim(),
        source_tag: activeTag ?? (isCR ? "cr" : "announcer"),
      })
      .select("*, author:profiles(id, full_name, role)")
      .single();

    setPosting(false);

    if (error) { setPostError("Failed to post. Please try again."); return; }
    setLocalAnnouncements([data, ...localAnnouncements]);
    setBody("");
    setActiveTag(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">

      {/* Feed */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">
            section {profile.section} feed
          </h1>
          <div className="flex gap-1.5">
            {(["all", "announcement", "material"] as const).map((t) => (
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
                {t === "all" ? "all" : t === "announcement" ? "announcements" : "materials"}
              </button>
            ))}
          </div>
        </div>

        {/* Composer */}
        {(tab === "all" || tab === "announcement") && (
          <div className="card p-4 border-brand-mid dark:border-brand-mid">
            <h4 className="flex items-center gap-2 text-xs font-medium text-brand dark:text-brand-mid mb-3">
              <Edit3 size={13} />
              post to section {profile.section}
              {profile.role === "announcer" && (
                <span className="text-gray-400 dark:text-gray-600 font-normal">· as announcer</span>
              )}
            </h4>
            <textarea
              className="input resize-none min-h-[68px] text-sm"
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
                        ? SOURCE_TAG_STYLES[t]
                        : "border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                    )}
                  >
                    {SOURCE_TAG_LABELS[t]}
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
            {postError && <p className="text-xs text-red-500 mt-2">{postError}</p>}
          </div>
        )}

        {/* Pinned announcements */}
        {(tab === "all" || tab === "announcement") && (
          <>
            {localAnnouncements.filter((a) => a.is_pinned).length > 0 && (
              <>
                <div className="section-divider">pinned</div>
                {localAnnouncements.filter((a) => a.is_pinned).map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} isCR={isCR} currentUserId={profile.id} onDelete={(id) => setLocalAnnouncements((prev) => prev.filter((x) => x.id !== id))} />
                ))}
              </>
            )}

            <div className="section-divider">recent</div>
            {localAnnouncements.filter((a) => !a.is_pinned).length === 0 && (
              <div className="card p-6 text-center text-sm text-gray-400 dark:text-gray-600">
                No announcements yet. Post the first one above.
              </div>
            )}
            {localAnnouncements.filter((a) => !a.is_pinned).map((a) => (
              <AnnouncementCard key={a.id} announcement={a} isCR={isCR} currentUserId={profile.id} onDelete={(id) => setLocalAnnouncements((prev) => prev.filter((x) => x.id !== id))} />
            ))}
          </>
        )}

        {/* Materials */}
        {(tab === "all" || tab === "material") && (
          <>
            <div className="section-divider">recent materials</div>
            {materials.length === 0 ? (
              <div className="card p-6 text-center text-sm text-gray-400 dark:text-gray-600">
                No materials yet for your branch and year.
              </div>
            ) : (
              materials.map((m) => <DashboardMaterialRow key={m.id} material={m} />)
            )}
          </>
        )}
      </div>

      {/* Right panel */}
      <div className="flex flex-col gap-4">
        {/* Upcoming dates */}
        {dates.length > 0 && (
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">upcoming dates</p>
            {dates.map((d) => (
              <div key={d.id} className="flex gap-3 py-2.5 border-b border-black/8 dark:border-white/8 last:border-0 last:pb-0">
                <div className="text-center w-9 flex-shrink-0">
                  <div className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-none">{format(parseISO(d.date), "d")}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-600 uppercase">{format(parseISO(d.date), "MMM")}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.title}</p>
                  {d.description && <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{d.description}</p>}
                  <span className={cn("tag mt-1", DATE_TYPE_STYLES[d.type])}>{d.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CR stats */}
        {isCR && (
          <div className="card p-4">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">
              section {profile.section}
            </p>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">students</span><span className="font-medium text-gray-900 dark:text-gray-100">{stats.members}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">announcers</span><span className="font-medium text-gray-900 dark:text-gray-100">{stats.announcers}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">materials uploaded</span><span className="font-medium text-gray-900 dark:text-gray-100">{stats.materials}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-black/8 dark:border-white/8">
              <Link
                href="/dashboard/manage-announcers"
                className="flex items-center justify-center gap-2 w-full text-xs font-medium text-brand dark:text-brand-mid bg-brand-light dark:bg-green-950 hover:opacity-80 transition-opacity px-3 py-2 rounded-lg"
              >
                <Users size={13} />
                manage announcers
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({
  announcement: a, isCR, currentUserId, onDelete,
}: {
  announcement: Announcement;
  isCR: boolean;
  currentUserId: string;
  onDelete: (id: string) => void;
}) {
  const supabase = createClient();
  const canDelete = isCR || a.author_id === currentUserId;

  async function handleDelete() {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", a.id);
    onDelete(a.id);
  }

  async function handleTogglePin() {
    await supabase.from("announcements").update({ is_pinned: !a.is_pinned }).eq("id", a.id);
    window.location.reload();
  }

  return (
    <div className={cn("card p-4", a.is_pinned && "border-brand-mid dark:border-brand-mid")}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
            a.author?.role === "cr"
              ? "bg-brand-light dark:bg-green-950 text-brand dark:text-brand-mid"
              : "bg-accent-light dark:bg-orange-950 text-accent"
          )}>
            {(a.author?.full_name ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {a.author?.full_name ?? "Unknown"}
              <span className="text-xs font-normal text-gray-400 dark:text-gray-600 ml-1">· {a.author?.role}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">{formatPostTime(a.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {a.is_pinned && (
            <span className="tag bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400">
              <Pin size={9} className="mr-0.5" />pinned
            </span>
          )}
          <span className={cn("tag", SOURCE_TAG_STYLES[a.source_tag])}>
            {SOURCE_TAG_LABELS[a.source_tag]}
          </span>
          {isCR && (
            <button
              onClick={handleTogglePin}
              title={a.is_pinned ? "unpin" : "pin"}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <Pin size={13} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1 text-gray-300 hover:text-red-500 dark:text-gray-700 dark:hover:text-red-400 transition-colors text-xs"
            >
              ✕
            </button>
          )}
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

function DashboardMaterialRow({ material: m }: { material: Material }) {
  return (
    <div className="card p-3.5 flex items-center gap-3 hover:border-brand-mid dark:hover:border-brand-mid transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("tag", MATERIAL_TYPE_STYLES[m.type])}>{MATERIAL_TYPE_LABELS[m.type]}</span>
          {m.subject && <span className="text-xs text-gray-400 dark:text-gray-600">{m.subject}</span>}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-600">{m.uploader_name} · {formatPostTime(m.created_at)}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-mid">
          <Star size={12} fill="currentColor" />{m.upvotes}
        </span>
        <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 transition-colors">
          <Download size={15} />
        </a>
      </div>
    </div>
  );
}
