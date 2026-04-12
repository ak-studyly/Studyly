"use client";

import { useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPostTime } from "@/lib/utils";
import type { Profile } from "@/types";

type Props = {
  crProfile: Profile;
  initialAnnouncers: Partial<Profile>[];
};

export default function ManageAnnouncersClient({ crProfile, initialAnnouncers }: Props) {
  const supabase = createClient();
  const [announcers, setAnnouncers] = useState(initialAnnouncers);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function grantAnnouncer() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Find profile by email
    const { data: target, error: fetchErr } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, college_id, branch, year, section")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (fetchErr || !target) {
      setError("No account found with that email. They need to sign in at least once first.");
      setLoading(false);
      return;
    }

    // Must be in the same section
    if (
      target.college_id !== crProfile.college_id ||
      target.branch !== crProfile.branch ||
      target.year !== crProfile.year ||
      target.section !== crProfile.section
    ) {
      setError("This person is not in your section. They must have the same college, branch, year, and section.");
      setLoading(false);
      return;
    }

    if (target.role === "announcer" || target.role === "cr") {
      setError("This person already has a posting role.");
      setLoading(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ role: "announcer", granted_by: crProfile.id })
      .eq("id", target.id);

    setLoading(false);

    if (updateErr) { setError("Failed to grant role. Please try again."); return; }

    setAnnouncers((prev) => [...prev, target]);
    setEmail("");
    setSuccess(`${target.full_name ?? target.email} is now an announcer.`);
  }

  async function revokeAnnouncer(id: string) {
    if (!confirm("Revoke announcer access for this person?")) return;
    await supabase.from("profiles").update({ role: null, granted_by: null }).eq("id", id);
    setAnnouncers((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
          manage announcers
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Announcers can post announcements to Section {crProfile.section}. They cannot manage other announcers or add important dates.
        </p>
      </div>

      {/* Grant form */}
      <div className="card p-5">
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <UserPlus size={15} className="text-brand dark:text-brand-mid" />
          add announcer
        </h2>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="their email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") grantAnnouncer(); }}
          />
          <button onClick={grantAnnouncer} disabled={loading || !email.trim()} className="btn-primary px-4 whitespace-nowrap">
            {loading ? "adding…" : "add"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
        {success && <p className="text-xs text-green-600 dark:text-green-400 mt-2">{success}</p>}
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
          The person must have signed in to Studyly at least once and be in Section {crProfile.section}.
        </p>
      </div>

      {/* Current announcers */}
      <div className="card p-5">
        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          current announcers ({announcers.length})
        </h2>
        {announcers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600">No announcers yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {announcers.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.full_name ?? a.email}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">{a.email}</p>
                </div>
                <button
                  onClick={() => revokeAnnouncer(a.id!)}
                  className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="revoke access"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
