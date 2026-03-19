import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { getActiveOwnersBySyndicId } from "@/lib/db/queries/owners";
import { OwnersTable } from "@/components/features/owners/owners-table";

export default async function OwnersPage() {
  const t = await getTranslations("owners");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let owners: Awaited<ReturnType<typeof getActiveOwnersBySyndicId>> = [];

  if (user) {
    owners = await getActiveOwnersBySyndicId(user.id);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitle")}
      </h1>
      <OwnersTable initialData={owners} />
    </div>
  );
}
