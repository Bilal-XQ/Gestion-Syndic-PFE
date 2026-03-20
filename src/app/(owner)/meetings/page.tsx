import { redirect } from "next/navigation";

export default function LegacyOwnerMeetingsPage() {
  redirect("/portal/meetings");
}
