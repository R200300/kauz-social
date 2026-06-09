export function PostSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
      <div className="flex items-center gap-3 p-3">
        <div className="h-10 w-10 rounded-full skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded skeleton-shimmer" />
          <div className="h-2.5 w-1/4 rounded skeleton-shimmer" />
        </div>
        <div className="h-7 w-16 rounded-full skeleton-shimmer" />
      </div>
      <div className="aspect-square w-full skeleton-shimmer" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        <div className="h-3 w-3/4 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
