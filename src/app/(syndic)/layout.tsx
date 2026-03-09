import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getUserNameById } from "@/lib/db/queries/owners";
import { AppSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function SyndicLayout({
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

  const metadataFirstName =
    typeof user?.user_metadata?.first_name === "string"
      ? user.user_metadata.first_name
      : "";
  const metadataLastName =
    typeof user?.user_metadata?.last_name === "string"
      ? user.user_metadata.last_name
      : "";

  const shouldQueryDbName =
    Boolean(user?.id) && (!metadataFirstName || !metadataLastName);
  const nameRow = shouldQueryDbName && user?.id ? await getUserNameById(user.id) : null;
  const firstName = metadataFirstName || nameRow?.firstName || "";
  const lastName = metadataLastName || nameRow?.lastName || "";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar firstName={firstName} lastName={lastName} />
      <SidebarInset className="bg-[--bg-base]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
