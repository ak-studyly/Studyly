"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/layout/AuthProvider";
import type { DateType } from "@/types";

const DATE_TYPES: { value: DateType; label: string }[] = [
  { value: "exam",       label: "exam" },
  { value: "submission", label: "submission / assignment" },
  { value: "event",      label: "event" },
];

export default function AddDateClient() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle]      = useState("");
  const [description, setDesc] = useState("");
  const [date, setDate]        = useState("");
  const [type, setType]        = useState<DateType>("event");
  const [loading, setLoading]  = useState(false);
  const [done, setDone]        = useState(false);
  const [error, setError]      = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("important_dates").insert({
      college_id:  profile.college_id,
      branch:      profile.branch,
      year:        profile.year,
      section:     profile.section,
      author_id:   profile.id,
      title,
      description: description || null,
      date,
      type,
    });

    setLoading(false);
    if (error) { setError("Failed to add date. Please try again."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-md pt-16 flex flex-col items-center gap-3 text-center">
        <CheckCircle size={40} className="text-brand dark:text-brand-mid" />
        <h2 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">Date added!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          It will appear in the upcoming dates panel for Section {profile?.section}.
        </p>
        <div className="flex gap-2 mt-2">
          <button onClick={() => router.push("/dashboard")} className="btn-secondary">back to dashboard</button>
          <button onClick={() => { setDone(false); setTitle(""); setDesc(""); setDate(""); }} className="btn-primary">add another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          <CalendarPlus size={20} className="text-brand dark:text-brand-mid" />
          add important date
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This will appear in the upcoming dates panel for Section {profile?.section}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">title</label>
          <input className="input" placeholder="e.g. End-semester exams begin" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            description <span className="text-gray-300 dark:text-gray-700">(optional)</span>
          </label>
          <input className="input" placeholder="e.g. See schedule PDF" value={description} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">type</label>
          <div className="flex gap-2">
            {DATE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  type === t.value
                    ? "bg-brand border-brand text-white font-medium"
                    : "border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-1">
          {loading ? "adding…" : "add date"}
        </button>
      </form>
    </div>
  );
}