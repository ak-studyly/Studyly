import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Chat from "@/components/public/Chat";

export default async function DashboardDiscussionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.role || !profile.college_id) redirect("/");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
          discussions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Section {profile.section} chat — open to all students, no login needed to participate.
        </p>
      </div>
      <div className="card overflow-hidden relative">
        <Chat
          collegeId={profile.college_id}
          branch={profile.branch!}
          year={profile.year!}
          section={profile.section!}
        />
      </div>
    </div>
  );
}
