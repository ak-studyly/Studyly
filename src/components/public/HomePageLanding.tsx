"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Users, Star, MessageCircle, Megaphone, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/components/layout/AuthProvider";

export default function HomepageLanding() {
  const router = useRouter();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
        <Navbar />

        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          <span className="inline-block text-xs font-medium bg-brand-light dark:bg-green-950 text-brand dark:text-brand-mid px-4 py-1.5 rounded-full mb-6">
            study smarter, together
          </span>

          <h1 className="font-serif text-4xl md:text-6xl font-semibold text-gray-900 dark:text-gray-100 leading-tight max-w-3xl mb-6">
            Your college, <em className="text-brand dark:text-brand-mid not-italic">organised</em>
          </h1>

          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed mb-12">
            Studyly brings together everything your class needs — shared study materials, 
            CR announcements, and section discussions. No more digging through WhatsApp chats.
          </p>

          {/* Two main CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={() => router.push("/materials")}
              className="flex items-center justify-center gap-3 bg-brand dark:bg-brand text-white px-8 py-4 rounded-xl text-base font-medium hover:opacity-90 transition-opacity group"
            >
              <BookOpen size={20} />
              browse materials
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => router.push("/classroom")}
              className="flex items-center justify-center gap-3 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border border-black/10 dark:border-white/10 px-8 py-4 rounded-xl text-base font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors group"
            >
              <Users size={20} />
              my classroom
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { icon: <BookOpen size={13} />,     label: "notes & past papers" },
              { icon: <Megaphone size={13} />,    label: "CR announcements" },
              { icon: <MessageCircle size={13} />,label: "section discussions" },
              { icon: <Star size={13} />,         label: "community upvotes" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-900 border border-black/8 dark:border-white/8 px-3 py-1.5 rounded-full"
              >
                {f.icon}
                {f.label}
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 dark:bg-neutral-900 border-t border-black/8 dark:border-white/8 px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 tracking-widest uppercase mb-10">
              how it works
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Materials */}
              <div className="bg-white dark:bg-neutral-950 border border-black/8 dark:border-white/8 rounded-2xl p-6">
                <div className="w-10 h-10 bg-brand-light dark:bg-green-950 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen size={18} className="text-brand dark:text-brand-mid" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  study materials
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  Browse and download notes, past papers, slides, and summaries uploaded by students at your college. Filter by branch, year, and subject. Upload your own to help your peers.
                </p>
                <button
                  onClick={() => router.push("/materials")}
                  className="text-sm text-brand dark:text-brand-mid font-medium flex items-center gap-1 hover:gap-2 transition-all"
                >
                  browse materials <ArrowRight size={14} />
                </button>
              </div>

              {/* Classroom */}
              <div className="bg-white dark:bg-neutral-950 border border-black/8 dark:border-white/8 rounded-2xl p-6">
                <div className="w-10 h-10 bg-brand-light dark:bg-green-950 rounded-xl flex items-center justify-center mb-4">
                  <Users size={18} className="text-brand dark:text-brand-mid" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  your classroom
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                  Your section's private space. See announcements from your CR, check upcoming exam and submission dates, and chat with your classmates — no login needed to participate.
                </p>
                <button
                  onClick={() => router.push("/classroom")}
                  className="text-sm text-brand dark:text-brand-mid font-medium flex items-center gap-1 hover:gap-2 transition-all"
                >
                  go to classroom <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-black/8 dark:border-white/8 px-6 py-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            <span className="font-serif text-sm text-brand dark:text-brand-mid font-semibold">Study<em>ly</em></span>
            {" "}· built by students, for students
          </p>
        </footer>
      </div>
    </AuthProvider>
  );
}
