export default function ImmeublesLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-[16px] border border-[--border-default] bg-[--bg-card]"
        />
      ))}
    </div>
  );
}
