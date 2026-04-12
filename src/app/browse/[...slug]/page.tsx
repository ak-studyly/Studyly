import { createClient } from "@/lib/supabase/server";
import BrowseClient from "@/components/public/BrowseClient";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ section?: string; subject?: string }>;
};

export default async function BrowsePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { section, subject } = await searchParams;
  const [collegeSlug, branchSlug, yearStr] = slug;
  const year = parseInt(yearStr);

  const supabase = await createClient();

  // Resolve college from slug
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, city, state, approved, created_at")
    .eq("approved", true);

  const found = colleges?.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === collegeSlug
  );

  if (!found) {
    return <div className="p-8 text-gray-500">College not found.</div>;
  }

  const college = {
    id: found.id,
    name: found.name,
    city: found.city,
    state: found.state,
    approved: found.approved,
    created_at: found.created_at,
  };
  if (!college) return <div className="p-8 text-gray-500">College not found.</div>;

  const branch = decodeURIComponent(branchSlug)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Fetch materials
  let matQuery = supabase
    .from("materials")
    .select("*")
    .eq("college_id", college.id)
    .eq("branch", branch)
    .eq("year", year)
    .eq("approved", true)
    .order("upvotes", { ascending: false });

  if (subject) matQuery = matQuery.ilike("subject", `%${subject}%`);

  const { data: materials } = await matQuery;

  // Fetch announcements (if section provided)
  let announcements = null;
  let dates = null;
  if (section) {
    const { data: ann } = await supabase
      .from("announcements")
      .select("*, author:profiles(id, full_name, role)")
      .eq("college_id", college.id)
      .eq("branch", branch)
      .eq("year", year)
      .eq("section", section)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    announcements = ann;

    const { data: d } = await supabase
      .from("important_dates")
      .select("*")
      .eq("college_id", college.id)
      .eq("branch", branch)
      .eq("year", year)
      .eq("section", section)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(5);
    dates = d;
  }

  return (
    <BrowseClient
      college={college}
      branch={branch}
      year={year}
      section={section ?? null}
      initialMaterials={materials ?? []}
      initialAnnouncements={announcements ?? []}
      initialDates={dates ?? []}
    />
  );
}
