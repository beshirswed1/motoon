export default function BooksLoading() {
  return (
    <div className="container-motoon py-12 section-padding min-h-screen">
      <div className="mb-10 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded mb-4"></div>
        <div className="h-5 w-64 bg-muted rounded"></div>
      </div>

      <div className="mb-8 rounded-xl border bg-card p-4 shadow-sm animate-pulse">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="h-10 w-full rounded-md bg-muted flex-1"></div>
          <div className="w-full sm:w-48 flex gap-2">
            <div className="h-10 w-full rounded-md bg-muted"></div>
            <div className="h-10 w-20 rounded-md bg-primary/20"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex flex-col rounded-xl border bg-card shadow-sm h-[360px] animate-pulse">
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
  );
}
