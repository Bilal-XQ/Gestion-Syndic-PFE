export default function PaymentsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="h-8 w-40 animate-pulse rounded-[8px] bg-[--bg-card]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-[20px] border border-[--border-subtle] bg-[--bg-card]" />
    </div>
  );
}
