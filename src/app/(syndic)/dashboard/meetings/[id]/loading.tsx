export default function MeetingDetailLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-8 w-64 animate-pulse rounded-[8px] bg-[--bg-card]" />
      <div className="h-40 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]" />
      <div className="h-64 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]" />
    </div>
  );
}
