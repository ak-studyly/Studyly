import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/layout/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Only CR and announcers can access the dashboard
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.role) redirect("/");

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-[220px_1fr] gap-5">
          <DashboardSidebar profile={profile} />
          <main>{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
