import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { getAllBuildingsBySyndicId } from "@/lib/db/queries/buildings";
import { ImmeublesList } from "@/components/features/immeubles/immeubles-list";

export default async function ImmeublesPage() {
  const t = await getTranslations("immeubles");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const buildings = user ? await getAllBuildingsBySyndicId(user.id) : [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitle")}
      </h1>
      <ImmeublesList initialData={buildings} />
    </div>
  );
}
