export function LoadingView() {
  return (
    <div className="status" role="status" aria-live="polite">
      <div className="skeleton-card" aria-hidden="true"><span /><span /><span /></div>
      <p>Reading your notes and writing cards…</p>
    </div>
  );
}

export function EmptyView() {
  return (
    <div className="status empty">
      <h2>Nothing to study yet</h2>
      <p>Paste your notes above. You get flashcards to flip through and a quiz that lets you re-test what you missed.</p>
    </div>
  );
}

export function ErrorBanner({ error, onRetry, hasDeck }) {
  return (
    <div className="error" role="alert">
      <p>
        <strong>Couldn’t build your study set.</strong> {error.message}
        {hasDeck ? ' Your previous set is still below.' : ''}
      </p>
      {error.retryable ? (
        <button className="btn" onClick={onRetry}>Try again</button>
      ) : (
        <p className="hint">Fix the issue above, then generate again.</p>
      )}
    </div>
  );
}
