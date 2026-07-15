export default function Loading() {
  return (
    <main className="loading-page" aria-label="Loading movies">
      <div className="loading-hero shimmer" />
      <div className="content-shell">
        <div className="loading-title shimmer" />
        <div className="loading-grid">
          {Array.from({ length: 6 }).map((_, index) => <div className="loading-card shimmer" key={index} />)}
        </div>
      </div>
    </main>
  );
}
