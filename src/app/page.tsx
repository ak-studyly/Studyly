export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import HomepageClient from "@/components/public/HomepageClient";
import type { College } from "@/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, city, state")
    .eq("approved", true)
    .order("name");

  return (
    <Suspense>
      <HomepageClient colleges={(colleges as College[]) ?? []} />
    </Suspense>
  );
}
