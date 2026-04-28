"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Download, Search, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/layout/AuthProvider";
import AddCollegeModal from "@/components/ui/AddCollegeModal";
import { createClient } from "@/lib/supabase/client";
import {
  cn, BRANCHES, YEARS, MATERIAL_TYPE_LABELS, MATERIAL_TYPE_STYLES, formatPostTime,
} from "@/lib/utils";
import type { College, Material, MaterialType } from "@/types";
import { PlusCircle } from "lucide-react";

const ALL_TYPES: { value: MaterialType | "all"; label: string }[] = [
  { value: "all",       label: "all" },
  { value: "notes",     label: "notes" },
  { value: "past_paper",label: "past paper" },
  { value: "slides",    label: "slides" },
  { value: "summary",   label: "summary" },
];

type Props = { colleges: College[] };

export default function MaterialsClient({ colleges }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [collegeId, setCollegeId]   = useState("");
  const [branch, setBranch]         = useState("");
  const [year, setYear]             = useState("");
  const [subject, setSubject]       = useState("");
  const [typeFilter, setTypeFilter] = useState<MaterialType | "all">("all");
  const [materials, setMaterials]   = useState<Material[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [addCollegeOpen, setAddCollegeOpen] = useState(false);

  const step1Done = !!collegeId;
  const step2Done = step1Done && !!branch && !!year;

  async function handleSearch() {
    if (!step2Done) return;
    setLoading(true);
    setSearched(true);

    let q = supabase
      .from("materials")
      .select("*")
      .eq("college_id", collegeId)
      .eq("branch", branch)
      .eq("year", parseInt(year))
      .eq("approved", true)
      .order("upvotes", { ascending: false });

    if (subject.trim()) q = q.ilike("subject", `%${subject.trim()}%`);
    if (typeFilter !== "all") q = q.eq("type", typeFilter);

    const { data } = await q;
    setMaterials((data as Material[]) ?? []);
    setLoading(false);
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar />

        <div className="max-w-4xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              study materials
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Notes, past papers, slides and summaries — shared by students, for students.
            </p>
          </div>

          {/* Search card */}
          <div className="card p-5 mb-6">
            {/* Progress dots */}
            <div className="flex items-center gap-2 mb-4">
              <div className={cn("w-2 h-2 rounded-full transition-colors", step1Done ? "bg-brand dark:bg-brand-mid" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs", step1Done ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400")}>college</span>
              <div className={cn("w-2 h-2 rounded-full transition-colors", step2Done ? "bg-brand dark:bg-brand-mid" : step1Done ? "bg-brand-mid/40" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs", step2Done ? "text-gray-700 dark:text-gray-300 font-medium" : step1Done ? "text-gray-500" : "text-gray-400")}>branch & year</span>
              <div className={cn("w-2 h-2 rounded-full transition-colors", step2Done ? "bg-brand-mid/40" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs text-gray-400")}>subject (optional)</span>
            </div>

            {/* Row 1 — college */}
            <div className="flex gap-2 mb-2">
              <select
                className="select flex-1"
                value={collegeId}
                onChange={(e) => { setCollegeId(e.target.value); setBranch(""); setYear(""); }}
              >
                <option value="">select your college…</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
                ))}
              </select>
            </div>

            {/* Row 2 — branch + year, revealed after college */}
            <div className={cn(
              "flex gap-2 flex-wrap transition-all duration-300 overflow-hidden",
              step1Done ? "max-h-40 opacity-100 mb-2" : "max-h-0 opacity-0"
            )}>
              <select className="select flex-1 min-w-36" value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">select branch…</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className="select w-32" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">year…</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>

            {/* Row 3 — subject + search, revealed after branch+year */}
            <div className={cn(
              "flex gap-2 transition-all duration-300 overflow-hidden",
              step2Done ? "max-h-20 opacity-100 mb-2" : "max-h-0 opacity-0"
            )}>
              <input
                className="input flex-1"
                placeholder="subject (optional) — e.g. Operating Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              />
              <button onClick={handleSearch} disabled={!step2Done || loading} className="btn-primary px-5 whitespace-nowrap flex items-center gap-2">
                <Search size={14} />
                {loading ? "searching…" : "search"}
              </button>
            </div>

            <button
              onClick={() => setAddCollegeOpen(true)}
              className="flex items-center gap-1.5 text-xs text-brand dark:text-brand-mid hover:underline mt-1"
            >
              <PlusCircle size={13} />
              don't see your college? add it
            </button>
          </div>

          {/* Type filter — shown after search */}
          {searched && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <SlidersHorizontal size={14} className="text-gray-400" />
              {ALL_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    typeFilter === t.value
                      ? "bg-brand border-brand text-white font-medium"
                      : "border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {searched && !loading && (
            <>
              {materials.length === 0 ? (
                <div className="card p-10 text-center">
                  <p className="text-gray-400 dark:text-gray-600 text-sm mb-3">
                    No materials found. Be the first to upload!
                  </p>
                  <button onClick={() => router.push("/upload")} className="btn-primary">
                    upload material
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-400 dark:text-gray-600">
                    {materials.length} result{materials.length !== 1 ? "s" : ""}
                  </p>
                  {materials
                    .filter((m) => typeFilter === "all" || m.type === typeFilter)
                    .map((m) => (
                      <MaterialCard key={m.id} material={m} />
                    ))}
                </div>
              )}
            </>
          )}

          {/* Upload CTA — always visible */}
          {!searched && (
            <div className="border border-dashed border-black/10 dark:border-white/10 rounded-xl p-5 flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-neutral-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="text-gray-900 dark:text-gray-100 font-medium">Have good notes?</span>{" "}
                Share them and help your peers.
              </p>
              <button onClick={() => router.push("/upload")} className="btn-primary">
                upload material
              </button>
            </div>
          )}
        </div>
      </div>
      <AddCollegeModal open={addCollegeOpen} onClose={() => setAddCollegeOpen(false)} />
  );
}

function MaterialCard({ material: m }: { material: Material }) {
  return (
    <div className="card p-4 flex items-center gap-3 hover:border-brand-mid dark:hover:border-brand-mid transition-colors cursor-pointer">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("tag", MATERIAL_TYPE_STYLES[m.type])}>
            {MATERIAL_TYPE_LABELS[m.type]}
          </span>
          {m.subject && <span className="text-xs text-gray-400 dark:text-gray-600">{m.subject}</span>}
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
