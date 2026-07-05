export default function BookDetailsLoading() {
  return (
    <div className="container-motoon py-12 section-padding min-h-screen">
      <div className="mb-8">
        <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
        {/* Sidebar Skeleton */}
        <div className="flex flex-col gap-6 md:col-span-1">
          <div className="relative aspect-[3/4] w-full rounded-xl bg-muted animate-pulse"></div>
          <div className="flex flex-col gap-3">
            <div className="h-12 w-full bg-muted rounded-md animate-pulse"></div>
            <div className="h-12 w-full bg-muted rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex flex-col md:col-span-2">
          <div className="mb-4">
            <div className="h-8 w-20 bg-muted rounded-full animate-pulse"></div>
          </div>
          
          <div className="h-10 w-3/4 bg-muted rounded-lg mb-4 animate-pulse"></div>
          <div className="h-6 w-1/3 bg-muted rounded-md mb-10 animate-pulse"></div>

          <div className="mb-10">
            <div className="h-8 w-32 bg-muted rounded-md mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
            </div>
          </div>

          <div className="h-28 w-full bg-muted rounded-xl mb-10 animate-pulse"></div>

          <div className="mb-10">
            <div className="h-8 w-40 bg-muted rounded-md mb-6 animate-pulse"></div>
            <div className="h-48 w-full bg-muted rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
