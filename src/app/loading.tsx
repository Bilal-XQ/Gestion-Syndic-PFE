export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-base]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-pulse rounded-[12px] border border-[--border-default] bg-[--bg-card]" />
        <div className="h-4 w-32 animate-pulse rounded-[8px] bg-[--bg-card]" />
      </div>
    </div>
  );
}
