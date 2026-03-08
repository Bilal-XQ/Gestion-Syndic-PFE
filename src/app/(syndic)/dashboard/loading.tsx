export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded-[8px] bg-[--bg-card]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]" />
    </div>
  );
}
