import { useEffect, useRef, useState } from 'react';

function QuizRun({ questions, label, onNewRun }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]); // { q, correct }
  const [done, setDone] = useState(false);
  const nextRef = useRef(null);

  const q = questions[i];

  useEffect(() => { if (picked !== null) nextRef.current?.focus(); }, [picked]);

  const choose = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    setResults((r) => [...r, { q, correct: idx === q.answerIndex }]);
  };
  const next = () => {
    if (i + 1 < questions.length) { setI(i + 1); setPicked(null); } else setDone(true);
  };
  const onKey = (e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= q.options.length && !done) choose(n - 1);
  };

  if (done) {
    const missed = results.filter((r) => !r.correct).map((r) => r.q);
    const score = results.length - missed.length;
    return (
      <div className="quiz-done">
        <h2>{score} / {results.length} correct</h2>
        {missed.length === 0 ? (
          <p>Clean sweep. Nothing to re-test.</p>
        ) : (
          <>
            <p>Review what you missed:</p>
            <ul className="missed">
              {missed.map((m, k) => (
                <li key={k}>
                  <strong>{m.question}</strong>
                  <span>Answer: {m.options[m.answerIndex]}</span>
                  {m.explanation && <em>{m.explanation}</em>}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="actions">
          {missed.length > 0 && <button className="btn btn-primary" onClick={() => onNewRun(missed, `Re-test: ${missed.length} missed`)}>Re-test {missed.length} missed</button>}
          <button className="btn" onClick={() => onNewRun(null, 'Full quiz')}>Retake full quiz</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz" onKeyDown={onKey}>
      <div className="flash-meta"><span>{label}</span><span>Question {i + 1} of {questions.length}</span></div>
      <h2 className="q-text">{q.question}</h2>
      <ul className="options">
        {q.options.map((opt, idx) => {
          const state = picked === null ? '' : idx === q.answerIndex ? 'right' : idx === picked ? 'wrong' : 'dim';
          return (
            <li key={idx}>
              <button className={`option ${state}`} onClick={() => choose(idx)} aria-disabled={picked !== null}>
                <span className="option-key" aria-hidden="true">{idx + 1}</span>
                <span>{opt}</span>
                {state === 'right' && <span className="tag">Correct</span>}
                {state === 'wrong' && <span className="tag">Your answer</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== null && (
        <div className="feedback" role="status">
          <p><strong>{picked === q.answerIndex ? 'Correct.' : 'Not quite.'}</strong> {q.explanation}</p>
          <button className="btn btn-primary" ref={nextRef} onClick={next}>{i + 1 < questions.length ? 'Next question' : 'See results'}</button>
        </div>
      )}
    </div>
  );
}

export default function Quiz({ questions }) {
  const [run, setRun] = useState({ id: 0, qs: questions, label: 'Full quiz' });
  if (!questions.length) return <p className="muted">The AI didn’t return any quiz questions for this set. Try regenerating.</p>;
  const onNewRun = (qs, label) => setRun((r) => ({ id: r.id + 1, qs: qs ?? questions, label }));
  return <QuizRun key={run.id} questions={run.qs} label={run.label} onNewRun={onNewRun} />;
}
