import { createClient } from "@/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h1>Debug</h1>
      <p>User: {user ? user.email : "NOT LOGGED IN"}</p>
      <p>Profile role: {profile?.role ?? "NO ROLE"}</p>
      <p>Profile section: {profile?.section ?? "NO SECTION"}</p>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}
