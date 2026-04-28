"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { BRANCHES, YEARS, SECTIONS, cn } from "@/lib/utils";
import type { College } from "@/types";

const CLASS_KEY = "studyly_classroom";

type SavedClass = {
  collegeId: string;
  collegeName: string;
  branch: string;
  year: number;
  section: string;
};

function buildPath(c: SavedClass) {
  return `/classroom/${encodeURIComponent(c.collegeName.toLowerCase().replace(/\s+/g, "-"))}/${encodeURIComponent(c.branch.toLowerCase().replace(/\s+/g, "-"))}/${c.year}/${c.section.toLowerCase()}`;
}

type Props = { colleges: College[] };

export default function ClassroomEntry({ colleges }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedClass | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [collegeId, setCollegeId] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CLASS_KEY);
      if (stored) {
        const parsed: SavedClass = JSON.parse(stored);
        setSaved(parsed);
        router.replace(buildPath(parsed));
      } else {
        setShowSetup(true);
      }
    } catch {
      setShowSetup(true);
    }
  }, []);

  function handleGo() {
    if (!collegeId || !branch || !year || !section) return;
    const college = colleges.find((c) => c.id === collegeId);
    if (!college) return;
    const saved: SavedClass = {
      collegeId,
      collegeName: college.name,
      branch,
      year: parseInt(year),
      section: section.toUpperCase(),
    };
    localStorage.setItem(CLASS_KEY, JSON.stringify(saved));
    router.push(buildPath(saved));
  }

  if (!showSetup) {
    return (
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
          <div className="text-sm text-gray-400 dark:text-gray-600">loading your classroom…</div>
        </div>
      </AuthProvider>
    );
  }

  const canGo = !!collegeId && !!branch && !!year && !!section;

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-16">
          <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            your classroom
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
            Set up your classroom once — we'll remember it so you can jump straight in next time.
          </p>

          <div className="card p-6 flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">college</label>
              <select className="select" value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
                <option value="">select your college…</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
                ))}
              </select>
            </div>

            <div className={cn("flex gap-3 transition-all duration-300 overflow-hidden", collegeId ? "max-h-40 opacity-100" : "max-h-0 opacity-0")}>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">branch</label>
                <select className="select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option value="">branch…</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="w-28">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">year</label>
                <select className="select" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">year…</option>
                  {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
                </select>
              </div>
              <div className="w-28">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">section</label>
                <select className="select" value={section} onChange={(e) => setSection(e.target.value)}>
                  <option value="">section…</option>
                  {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleGo} disabled={!canGo} className="btn-primary mt-1">
              go to my classroom →
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-4">
            Your classroom preference is saved in your browser. You can change it anytime.
          </p>
        </div>
      </div>
  );
}
