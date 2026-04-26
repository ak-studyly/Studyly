import { createClient } from "@/lib/supabase/server";
import ClassroomClient from "@/components/public/ClassroomClient";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function ClassroomSlugPage({ params }: Props) {
  const { slug } = await params;
  const [collegeSlug, branchSlug, yearStr, sectionStr] = slug;
  const year = parseInt(yearStr);
  const section = sectionStr.toUpperCase();

  const supabase = await createClient();

  // Resolve college
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, city, state")
    .eq("approved", true);

  const college = colleges?.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === collegeSlug
  );
  if (!college) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Classroom not found.</p>
      </div>
    );
  }

  const branch = decodeURIComponent(branchSlug)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Fetch announcements
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, author:profiles(id, full_name, role)")
    .eq("college_id", college.id)
    .eq("branch", branch)
    .eq("year", year)
    .eq("section", section)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  // Fetch upcoming dates
  const { data: dates } = await supabase
    .from("important_dates")
    .select("*")
    .eq("college_id", college.id)
    .eq("branch", branch)
    .eq("year", year)
    .eq("section", section)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(8);

  return (
    <ClassroomClient
      college={college}
      branch={branch}
      year={year}
      section={section}
      initialAnnouncements={announcements ?? []}
      initialDates={dates ?? []}
    />
  );
}
