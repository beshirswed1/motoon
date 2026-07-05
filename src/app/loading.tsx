export default function HomeLoading() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      {/* Hero Skeleton */}
      <section className="bg-muted py-24 md:py-32 section-padding">
        <div className="container-motoon flex flex-col items-center text-center">
          <div className="h-12 md:h-16 w-3/4 max-w-2xl bg-primary/20 rounded-lg mb-6"></div>
          <div className="h-6 md:h-8 w-2/3 max-w-xl bg-primary/10 rounded-lg mb-10"></div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-12 w-40 bg-primary/20 rounded-md"></div>
            <div className="h-12 w-40 bg-primary/10 rounded-md"></div>
          </div>
        </div>
      </section>

      {/* Featured Books Skeleton */}
      <section className="py-20 section-padding">
        <div className="container-motoon">
          <div className="mb-12 flex items-end justify-between">
            <div className="w-1/2 md:w-1/3">
              <div className="h-8 w-32 bg-muted rounded-lg mb-4"></div>
              <div className="h-4 w-48 bg-muted rounded-lg"></div>
            </div>
            <div className="hidden md:block h-10 w-24 bg-muted rounded-md"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col rounded-xl border bg-card shadow-sm h-[360px]">
                <div className="aspect-[3/4] w-full bg-muted rounded-t-xl"></div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-6 w-3/4 bg-muted rounded"></div>
                  <div className="h-4 w-1/2 bg-muted rounded"></div>
                  <div className="mt-4 h-4 w-1/3 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
