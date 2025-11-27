import { Skeleton } from '@/components/ui/skeleton'

export function PlaceCardSkeleton() {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <Skeleton className="w-full h-32 rounded-md" />
      <Skeleton className="h-4 w-3/5 mt-3" />
      <Skeleton className="h-3 w-2/5 mt-2" />
      <div className="flex items-center gap-2 mt-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}
