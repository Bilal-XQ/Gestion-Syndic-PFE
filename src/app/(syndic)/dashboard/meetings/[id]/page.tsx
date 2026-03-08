import { MeetingDetail } from "@/components/features/meetings/meeting-detail";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <MeetingDetail meetingId={id} />
    </div>
  );
}
