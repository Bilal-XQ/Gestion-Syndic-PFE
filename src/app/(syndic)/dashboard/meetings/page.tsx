import { MeetingsTable } from "@/components/features/meetings/meetings-table";

export default function MeetingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Réunions
      </h1>
      <MeetingsTable />
    </div>
  );
}
