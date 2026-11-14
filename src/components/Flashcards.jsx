import { useEffect, useMemo, useRef, useState } from 'react';

export default function Flashcards({ cards }) {
  const [known, setKnown] = useState(() => new Set());
  const [onlyLearning, setOnlyLearning] = useState(false);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const wrap = useRef(null);

  const visible = useMemo(
    () => cards.map((c, i) => ({ ...c, i })).filter((c) => !onlyLearning || !known.has(c.i)),
    [cards, known, onlyLearning],
  );

  // Keep position valid when cards leave the "still learning" list.
  useEffect(() => {
    if (pos > visible.length - 1) setPos(Math.max(0, visible.length - 1));
  }, [visible.length, pos]);

  if (!cards.length) return <p className="muted">The AI didn’t return any flashcards for this set. Try regenerating.</p>;

  if (!visible.length) {
    return (
      <div className="status empty">
        <h2>All {cards.length} cards marked as known</h2>
        <button className="btn" onClick={() => { setKnown(new Set()); setOnlyLearning(false); setPos(0); }}>Start over</button>
      </div>
    );
  }

  const card = visible[Math.min(pos, visible.length - 1)];
  const go = (d) => { setFlipped(false); setPos((p) => (p + d + visible.length) % visible.length); };
  const toggleKnown = () => {
    setKnown((prev) => {
      const next = new Set(prev);
      next.has(card.i) ? next.delete(card.i) : next.add(card.i);
      return next;
    });
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === ' ' && e.target === wrap.current) { e.preventDefault(); setFlipped((f) => !f); }
  };

  return (
    <div className="flash" ref={wrap} tabIndex={0} onKeyDown={onKey} aria-label="Flashcards. Space flips, arrow keys move.">
      <div className="flash-meta">
        <span>Card {Math.min(pos, visible.length - 1) + 1} of {visible.length} · {known.size} known</span>
        <label className="check">
          <input type="checkbox" checked={onlyLearning} onChange={(e) => { setOnlyLearning(e.target.checked); setPos(0); setFlipped(false); }} />
          Only cards I’m still learning
        </label>
      </div>

      <button className={`card ${flipped ? 'is-flipped' : ''} ${known.has(card.i) ? 'is-known' : ''}`} onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Showing answer. Click to show question.' : 'Showing question. Click to show answer.'}>
        <span className="card-inner">
          <span className="card-face card-front"><span className="card-text">{card.front}</span></span>
          <span className="card-face card-back"><span className="card-text">{card.back}</span></span>
        </span>
      </button>

      <div className="flash-controls">
        <button className="btn" onClick={() => go(-1)} aria-label="Previous card">Back</button>
        <button className={`btn ${known.has(card.i) ? 'btn-on' : ''}`} onClick={toggleKnown} aria-pressed={known.has(card.i)}>
          {known.has(card.i) ? 'Known ✓' : 'I know this'}
        </button>
        <button className="btn" onClick={() => go(1)} aria-label="Next card">Next</button>
      </div>
    </div>
  );
}
