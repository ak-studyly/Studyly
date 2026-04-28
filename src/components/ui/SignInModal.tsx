"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";

type Props = { open: boolean; onClose: () => void };

export default function SignInModal({ open, onClose }: Props) {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { setError(error); return; }
    onClose();
    // Small delay to let auth state propagate, then refresh
    setTimeout(() => window.location.reload(), 300);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={18} />
        </button>

        <h2 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
          CR / announcer sign in
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Students don't need to sign in — this is only for CRs and announcers.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">email</label>
            <input
              type="email"
              className="input"
              placeholder="your@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
            {loading ? "signing in…" : "sign in"}
          </button>
        </form>

        <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-4">
          New CR? Your account is created by your college admin.
        </p>
      </div>
    </div>
  );
}
