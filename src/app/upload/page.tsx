"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { BRANCHES, YEARS, cn } from "@/lib/utils";
import type { College, MaterialType } from "@/types";
import { useEffect } from "react";

const MATERIAL_TYPES: { value: MaterialType; label: string }[] = [
  { value: "notes",      label: "notes" },
  { value: "past_paper", label: "past paper" },
  { value: "slides",     label: "slides" },
  { value: "summary",    label: "summary" },
];

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();

  const [colleges, setColleges] = useState<College[]>([]);
  const [collegeId, setCollegeId] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MaterialType>("notes");
  const [uploaderName, setUploaderName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("colleges").select("id, name, city, state").eq("approved", true).order("name")
      .then(({ data }) => setColleges((data as College[]) ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !collegeId || !branch || !year || !title) return;
    setLoading(true);
    setError(null);

    try {
      // Upload file to Supabase Storage
      const ext = file.name.split(".").pop();
      const path = `${collegeId}/${branch}/${year}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(path, file, { cacheControl: "3600" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("materials").getPublicUrl(path);

      // Insert material record (approved: false until reviewed)
      const { error: insertError } = await supabase.from("materials").insert({
        college_id: collegeId,
        branch,
        year: parseInt(year),
        subject: subject || null,
        title,
        type,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploader_name: anonymous ? "anonymous" : (uploaderName || "anonymous"),
        approved: false,
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
          <Navbar />
          <div className="max-w-md mx-auto pt-24 px-6 text-center">
            <CheckCircle size={48} className="text-brand dark:text-brand-mid mx-auto mb-4" />
            <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Upload submitted!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Your material is under review. Once approved by the community, it will appear on the browse page.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push("/")} className="btn-secondary">back to home</button>
              <button onClick={() => { setSubmitted(false); setFile(null); setTitle(""); setSubject(""); }} className="btn-primary">upload another</button>
            </div>
          </div>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-10">
          <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Upload material
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Help your peers by sharing your notes, past papers, or slides.
          </p>

          <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5">
            {/* College */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">college</label>
              <select className="select" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} required>
                <option value="">select college…</option>
                {colleges.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
              </select>
            </div>

            {/* Branch + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">branch</label>
                <select className="select" value={branch} onChange={(e) => setBranch(e.target.value)} required>
                  <option value="">select branch…</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">year</label>
                <select className="select" value={year} onChange={(e) => setYear(e.target.value)} required>
                  <option value="">year…</option>
                  {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                subject <span className="text-gray-300 dark:text-gray-700">(optional)</span>
              </label>
              <input className="input" placeholder="e.g. Operating Systems" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">title</label>
              <input className="input" placeholder="e.g. OS — Process Scheduling & Deadlocks" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">material type</label>
              <div className="flex gap-2 flex-wrap">
                {MATERIAL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all",
                      type === t.value
                        ? "bg-brand border-brand text-white font-medium"
                        : "border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">file</label>
              <label className={cn(
                "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors",
                file
                  ? "border-brand dark:border-brand-mid bg-brand-light dark:bg-green-950"
                  : "border-black/10 dark:border-white/10 hover:border-brand dark:hover:border-brand-mid"
              )}>
                <Upload size={20} className={file ? "text-brand dark:text-brand-mid" : "text-gray-400"} />
                <span className="text-sm text-center text-gray-500 dark:text-gray-400">
                  {file ? file.name : "click to upload — PDF, DOCX, PPTX, up to 20MB"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {/* Uploader name */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                your name <span className="text-gray-300 dark:text-gray-700">(optional)</span>
              </label>
              <input
                className="input"
                placeholder="how you want to appear — leave blank to be anonymous"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                disabled={anonymous}
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="rounded border-black/20 dark:border-white/20 text-brand focus:ring-brand"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">upload anonymously</span>
              </label>
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading || !file} className="btn-primary mt-1">
              {loading ? "uploading…" : "submit for review"}
            </button>

            <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
              Uploads are reviewed before going live to keep quality high.
            </p>
          </form>
        </div>
      </div>
    </AuthProvider>
  );
}
