export const dynamic = "force-dynamic";

"use client";

import { useState } from "react";
import { useAuth } from "@/components/layout/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null })
      .eq("id", profile.id);

    setLoading(false);
    if (error) { setError("Failed to save. Please try again."); return; }
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-md flex flex-col gap-6">
      <h1 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100">
        profile settings
      </h1>

      <div className="card p-5">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">account</p>
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1.5">
          <div className="flex justify-between"><span>email</span><span className="text-gray-900 dark:text-gray-100">{profile?.email}</span></div>
          <div className="flex justify-between"><span>role</span><span className="text-gray-900 dark:text-gray-100 capitalize">{profile?.role ?? "—"}</span></div>
          <div className="flex justify-between"><span>section</span><span className="text-gray-900 dark:text-gray-100">Section {profile?.section}</span></div>
        </div>
      </div>

      <form onSubmit={handleSave} className="card p-5 flex flex-col gap-4">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider">display name</p>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
            full name <span className="text-gray-300 dark:text-gray-700">(shown on announcements)</span>
          </label>
          <input
            className="input"
            placeholder="your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "saving…" : saved ? "saved ✓" : "save changes"}
        </button>
      </form>

      <div className="card p-5">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">appearance</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Toggle dark mode from the profile menu in the top-right corner of any page.
        </p>
      </div>
    </div>
  );
}
