export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardFeed from "@/components/dashboard/DashboardFeed";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.role || !profile.college_id) redirect("/");

  // Fetch announcements for this section
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, author:profiles(id, full_name, role)")
    .eq("college_id", profile.college_id)
    .eq("branch", profile.branch)
    .eq("year", profile.year)
    .eq("section", profile.section)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch recent materials for branch+year
  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .eq("college_id", profile.college_id)
    .eq("branch", profile.branch)
    .eq("year", profile.year)
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch upcoming dates
  const { data: dates } = await supabase
    .from("important_dates")
    .select("*")
    .eq("college_id", profile.college_id)
    .eq("branch", profile.branch)
    .eq("year", profile.year)
    .eq("section", profile.section)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(5);

  // Section stats (for CR panel)
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("college_id", profile.college_id)
    .eq("branch", profile.branch)
    .eq("year", profile.year)
    .eq("section", profile.section);

  const { count: announcerCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("college_id", profile.college_id)
    .eq("branch", profile.branch)
    .eq("year", profile.year)
    .eq("section", profile.section)
    .eq("role", "announcer");

  const { count: materialsCount } = await supabase
    .from("materials")
    .select("*", { count: "exact", head: true })
    .eq("college_id", profile.college_id)
    .eq("branch", profile.branch)
    .eq("year", profile.year)
    .eq("approved", true);

  return (
    <DashboardFeed
      profile={profile}
      announcements={announcements ?? []}
      materials={materials ?? []}
      dates={dates ?? []}
      stats={{ members: memberCount ?? 0, announcers: announcerCount ?? 0, materials: materialsCount ?? 0 }}
    />
  );
}
