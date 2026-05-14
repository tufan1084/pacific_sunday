export default function PostModalSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="p-4 md:p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-32" />
            <div className="h-3 bg-white/10 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 md:p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-4/5" />
            <div className="h-4 bg-white/10 rounded w-3/5" />
          </div>

          {/* Media skeleton */}
          <div className="aspect-[4/3] bg-white/10 rounded-2xl" />

          {/* Actions skeleton */}
          <div className="flex items-center gap-1 pt-2">
            <div className="w-12 h-12 bg-white/10 rounded-full" />
            <div className="w-12 h-12 bg-white/10 rounded-full" />
            <div className="w-12 h-12 bg-white/10 rounded-full" />
            <div className="w-12 h-12 bg-white/10 rounded-full ml-auto" />
          </div>
        </div>
      </div>

      {/* Comment input skeleton */}
      <div className="border-t border-white/5 p-3 md:p-4">
        <div className="h-11 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}
