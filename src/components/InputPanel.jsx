import { useState } from 'react';

export const MIN_CHARS = 20;
export const MAX_CHARS = 8000;

const SAMPLE = `Photosynthesis converts light energy into chemical energy. In the light-dependent reactions in the thylakoid membranes, chlorophyll absorbs light, water is split releasing oxygen, and ATP and NADPH are made. In the Calvin cycle in the stroma, CO2 is fixed by the enzyme RuBisCO and reduced using ATP and NADPH to form G3P, which is used to build glucose.`;

export default function InputPanel({ loading, onSubmit, onCancel }) {
  const [text, setText] = useState('');
  const len = text.trim().length;
  const tooShort = len < MIN_CHARS;
  const tooLong = text.length > MAX_CHARS;
  const canSubmit = !loading && !tooShort && !tooLong;

  const submit = (e) => {
    e?.preventDefault();
    if (canSubmit) onSubmit(text.trim());
  };

  return (
    <form className="input-panel" onSubmit={submit}>
      <label htmlFor="notes" className="field-label">Paste notes or name a topic</label>
      <textarea
        id="notes"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e); }}
        placeholder="e.g. lecture notes on the French Revolution, or just “how photosynthesis works”"
        rows={6}
        aria-describedby="notes-hint"
      />
      <div className="input-footer">
        <span id="notes-hint" className={`hint ${tooLong ? 'hint-bad' : ''}`}>
          {tooLong ? `${text.length - MAX_CHARS} characters over the limit` : `${text.length} / ${MAX_CHARS}`}
          {!tooLong && len > 0 && tooShort ? ` · add at least ${MIN_CHARS - len} more` : ''}
        </span>
        <div className="actions">
          <button type="button" className="btn-ghost" onClick={() => setText(SAMPLE)} disabled={loading}>Try a sample</button>
          {loading ? (
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>Make study set</button>
          )}
        </div>
      </div>
    </form>
  );
}
