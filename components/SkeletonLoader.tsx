'use client'

export function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="border border-white/10 bg-zinc-900 p-6 rounded-2xl animate-pulse">
          <div className="h-5 bg-zinc-800 rounded w-32 mb-3" />
          <div className="h-3 bg-zinc-800 rounded w-24 mb-4" />
          <div className="flex gap-2 mb-4">
            <div className="h-4 bg-zinc-800 rounded flex-1 max-w-xs" />
          </div>
          <div className="h-px bg-white/10 my-4" />
          <div className="h-4 bg-zinc-800 rounded w-40 mb-2" />
          <div className="h-3 bg-zinc-800 rounded w-28" />
        </div>
      ))}
    </div>
  )
}
