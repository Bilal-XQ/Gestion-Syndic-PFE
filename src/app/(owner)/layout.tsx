import { cookies } from "next/headers";
import { OwnerSidebar } from "@/components/layout/owner-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { createClient } from "@/utils/supabase/server";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? "";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <OwnerSidebar />
      <SidebarInset className="bg-[--bg-base]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
      {userId && <RealtimeProvider userId={userId} />}
    </SidebarProvider>
  );
}
