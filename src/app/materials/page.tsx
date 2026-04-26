import { createClient } from "@/lib/supabase/server";
import MaterialsClient from "@/components/public/MaterialsClient";
import type { College } from "@/types";

export default async function MaterialsPage() {
  const supabase = await createClient();
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, city, state")
    .eq("approved", true)
    .order("name");

  return <MaterialsClient colleges={(colleges as College[]) ?? []} />;
}
