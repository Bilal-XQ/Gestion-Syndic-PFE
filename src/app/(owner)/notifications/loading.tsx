export default function NotificationsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-8 w-40 animate-pulse rounded-[8px] bg-[--bg-card]" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-[12px] border border-[--border-subtle] bg-[--bg-card]"
          />
        ))}
      </div>
    </div>
  );
}
