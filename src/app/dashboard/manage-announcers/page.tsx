export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ManageAnnouncersClient from "@/components/dashboard/ManageAnnouncersClient";

export default async function ManageAnnouncersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "cr") redirect("/dashboard");

  // Fetch current announcers in this section
  const { data: announcers } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("college_id", profile.college_id)
    .eq("branch", profile.branch)
    .eq("year", profile.year)
    .eq("section", profile.section)
    .eq("role", "announcer");

  return (
    <ManageAnnouncersClient
      crProfile={profile}
      initialAnnouncers={announcers ?? []}
    />
  );
}
