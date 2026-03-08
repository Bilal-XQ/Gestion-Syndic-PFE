export default function PortalLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-8 w-36 animate-pulse rounded-[8px] bg-[--bg-card]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]" />
        <div className="h-48 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]" />
      </div>
    </div>
  );
}
