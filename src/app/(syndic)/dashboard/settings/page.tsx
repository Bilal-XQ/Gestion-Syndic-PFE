import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getBuildingBySyndicId } from "@/lib/db/queries/buildings";
import { SettingsForm } from "@/components/features/settings/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <h1 className="text-2xl font-semibold text-[--text-primary]">
          Paramètres
        </h1>
        <p className="text-sm text-[--text-muted]">Non authentifié</p>
      </div>
    );
  }

  const building = await getBuildingBySyndicId(user.id);

  // Fetch syndic user for contact info
  const [syndicUser] = await db
    .select({ phone: users.phone, email: users.email })
    .from(users)
    .where(eq(users.id, user.id));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Paramètres de l&apos;immeuble
      </h1>
      <SettingsForm
        defaultValues={{
          name: building?.name ?? "",
          address: building?.address ?? "",
          contactPhone: syndicUser?.phone ?? "",
          contactEmail: syndicUser?.email ?? "",
        }}
      />
    </div>
  );
}
