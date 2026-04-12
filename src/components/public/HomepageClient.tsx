"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Star, BookOpen, FileText, Presentation, AlignLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/layout/AuthProvider";
import AddCollegeModal from "@/components/ui/AddCollegeModal";
import { BRANCHES, YEARS, SECTIONS, cn } from "@/lib/utils";
import type { College } from "@/types";

const DEMO_MATERIALS = [
  { type: "notes" as const,      title: "OS — Process Scheduling & Deadlocks",  author: "riya_k",    daysAgo: 3,  votes: 142 },
  { type: "past_paper" as const, title: "DBMS End-Sem 2024 with solutions",      author: "anon",      daysAgo: 7,  votes: 89  },
  { type: "slides" as const,     title: "Computer Networks — TCP/IP Module 4",   author: "prashant",  daysAgo: 5,  votes: 61  },
  { type: "summary" as const,    title: "COA — Quick revision sheet, Unit 3 & 4",author: "sneha_21",  daysAgo: 0,  votes: 28  },
];

const TYPE_ICON = {
  notes:      <FileText size={17} />,
  past_paper: <BookOpen size={17} />,
  slides:     <Presentation size={17} />,
  summary:    <AlignLeft size={17} />,
};

const TYPE_STYLE = {
  notes:      { pill: "bg-brand-light text-brand-dark dark:bg-green-950 dark:text-green-300", icon: "bg-brand-light dark:bg-green-950 text-brand-dark dark:text-green-300" },
  past_paper: { pill: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",   icon: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" },
  slides:     { pill: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",        icon: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" },
  summary:    { pill: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",        icon: "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300" },
};

const STEPS = [
  { icon: "🏫", title: "pick your college", desc: "Search from hundreds of institutions — or add yours" },
  { icon: "📚", title: "choose branch & year", desc: "Filter to exactly your department and semester" },
  { icon: "📄", title: "access materials", desc: "Download peer-vetted notes, papers, and slides" },
  { icon: "💬", title: "discuss & ask", desc: "coming soon", soon: true },
];

type Props = { colleges: College[] };

export default function HomepageClient({ colleges }: Props) {
  const router = useRouter();
  const [collegeId, setCollegeId] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [addCollegeOpen, setAddCollegeOpen] = useState(false);

  const step1Done = !!collegeId;
  const step2Done = step1Done && !!branch && !!year;
  const canSearch = step2Done;

  function handleSearch() {
    if (!canSearch) return;
    const college = colleges.find((c) => c.id === collegeId);
    if (!college) return;
    const slug = `${encodeURIComponent(college.name.toLowerCase().replace(/\s+/g, "-"))}/${encodeURIComponent(branch.toLowerCase().replace(/\s+/g, "-"))}/${year}`;
    const params = new URLSearchParams();
    if (section) params.set("section", section);
    if (subject) params.set("subject", subject);
    router.push(`/browse/${slug}${params.toString() ? "?" + params.toString() : ""}`);
  }

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        {/* Hero */}
        <section className="bg-white dark:bg-neutral-900 pt-14 pb-10 px-6 text-center">
          <span className="inline-block text-xs font-medium bg-brand-light dark:bg-green-950 text-brand dark:text-brand-mid px-4 py-1 rounded-full mb-5">
            study smarter, together
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-gray-900 dark:text-gray-100 leading-tight max-w-2xl mx-auto mb-4">
            The study material hub built{" "}
            <em className="text-brand dark:text-brand-mid not-italic font-semibold">by students,</em>{" "}
            for students
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
            Access and share notes, past papers, and slides — filtered to your exact college, branch, and year.
          </p>

          {/* Search card */}
          <div className="card max-w-2xl mx-auto p-5 text-left">
            {/* Progress dots */}
            <div className="flex items-center gap-2 mb-4">
              <div className={cn("w-2 h-2 rounded-full transition-colors", step1Done ? "bg-brand dark:bg-brand-mid" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs", step1Done ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400 dark:text-gray-600")}>college</span>
              <div className={cn("w-2 h-2 rounded-full transition-colors", step2Done ? "bg-brand dark:bg-brand-mid" : step1Done ? "bg-brand-mid/40" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs", step2Done ? "text-gray-700 dark:text-gray-300 font-medium" : step1Done ? "text-gray-500 dark:text-gray-500" : "text-gray-400 dark:text-gray-600")}>branch & year</span>
              <div className={cn("w-2 h-2 rounded-full transition-colors", step2Done ? "bg-brand-mid/40" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs", step2Done ? "text-gray-500" : "text-gray-400 dark:text-gray-600")}>subject (optional)</span>
            </div>

            {/* Row 1 — always visible */}
            <div className="flex gap-2 mb-2">
              <select
                className="select flex-1"
                value={collegeId}
                onChange={(e) => { setCollegeId(e.target.value); setBranch(""); setYear(""); setSection(""); setSubject(""); }}
              >
                <option value="">select your college…</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
                ))}
              </select>
            </div>

            {/* Row 2 — revealed after college picked */}
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
              <select className="select w-32" value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="">section (optional)</option>
                {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>

            {/* Row 3 — subject, revealed after branch+year picked */}
            <div className={cn(
              "flex gap-2 transition-all duration-300 overflow-hidden",
              step2Done ? "max-h-20 opacity-100 mb-3" : "max-h-0 opacity-0"
            )}>
              <input
                className="input flex-1"
                placeholder="subject (optional) — e.g. Operating Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <button onClick={handleSearch} disabled={!canSearch} className="btn-primary px-6 whitespace-nowrap">
                search
              </button>
            </div>

            {/* Search button when subject row hidden */}
            {step1Done && !step2Done && (
              <button onClick={handleSearch} disabled={!canSearch} className="btn-primary w-full mt-1">
                search
              </button>
            )}

            {/* Add college link */}
            <button
              onClick={() => setAddCollegeOpen(true)}
              className="flex items-center gap-1.5 text-xs text-brand dark:text-brand-mid hover:underline mt-2"
            >
              <PlusCircle size={13} />
              don't see your college? add it
            </button>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 dark:bg-neutral-950 py-12 px-6">
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 tracking-widest uppercase mb-8">how it works</p>
          <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl",
                  s.soon
                    ? "bg-gray-100 dark:bg-neutral-800 text-gray-400"
                    : "bg-brand dark:bg-brand text-white"
                )}>
                  {s.icon}
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{s.title}</h3>
                <p className={cn("text-xs leading-relaxed", s.soon ? "text-brand dark:text-brand-mid" : "text-gray-500 dark:text-gray-400")}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sample materials */}
        <section className="bg-white dark:bg-neutral-900 py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-gray-400 dark:text-gray-600 tracking-widest uppercase mb-4">
              recent uploads — computer science · 3rd year
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_MATERIALS.map((m, i) => (
                <div key={i} className="card p-4 flex items-center gap-3 hover:border-brand-mid dark:hover:border-brand-mid transition-colors cursor-pointer">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", TYPE_STYLE[m.type].icon)}>
                    {TYPE_ICON[m.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {m.author} · {m.daysAgo === 0 ? "today" : `${m.daysAgo} days ago`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-mid flex-shrink-0">
                    <Star size={12} fill="currentColor" />
                    {m.votes}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border border-dashed border-black/10 dark:border-white/10 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 bg-gray-50 dark:bg-neutral-950">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="text-gray-900 dark:text-gray-100 font-medium">Have good notes?</span>{" "}
                Share them with your college and help your peers.
              </p>
              <button onClick={() => router.push("/upload")} className="btn-primary">
                upload material
              </button>
            </div>
          </div>
        </section>

        {/* Coming soon banner */}
        <div className="bg-gray-50 dark:bg-neutral-950 border-t border-black/8 dark:border-white/8 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-mid flex-shrink-0" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="text-gray-900 dark:text-gray-100 font-medium">Discussions coming soon</span>{" "}
              — ask questions, get answers from peers who took the same course.
            </p>
          </div>
        </div>
      </div>

      <AddCollegeModal open={addCollegeOpen} onClose={() => setAddCollegeOpen(false)} />
    </AuthProvider>
  );
}
