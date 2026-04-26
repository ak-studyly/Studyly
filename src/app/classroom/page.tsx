import ClassroomEntry from "@/components/public/ClassroomEntry";
import { createClient } from "@/lib/supabase/server";
import type { College } from "@/types";

export default async function ClassroomPage() {
  const supabase = await createClient();
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, city, state")
    .eq("approved", true)
    .order("name");

  return <ClassroomEntry colleges={(colleges as College[]) ?? []} />;
}
