// Turns raw, untrusted model text into a deck the UI can trust.
// Strategy: extract JSON -> check shape -> keep every valid item, drop invalid ones -> fail only if nothing usable is left.

export class DeckError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DeckError';
    this.code = code; // 'empty' | 'malformed' | 'shape' | 'nothing_usable'
  }
}

const MAX_OPTIONS = 5;
const str = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');

/** Models often wrap JSON in ```fences``` or add chatter around it. */
export function extractJson(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new DeckError('empty', 'The AI returned an empty response.');
  }
  let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    // fall through: try the outermost {...} block
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // fall through
    }
  }
  throw new DeckError('malformed', 'The AI response was not valid JSON (it may have been cut off).');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cleanCard(c) {
  const front = str(c?.front);
  const back = str(c?.back);
  return front && back ? { front, back } : null;
}

function cleanQuestion(q) {
  const question = str(q?.question);
  if (!question || !Array.isArray(q?.options)) return null;

  const options = [...new Set(q.options.map(str).filter(Boolean))].slice(0, MAX_OPTIONS);
  if (options.length < 2) return null;

  // Accept a numeric index, a numeric string, or the answer text itself.
  const rawAnswer = q.answerIndex ?? q.answer ?? q.correctIndex;
  let idx = -1;
  if (Number.isInteger(rawAnswer)) idx = rawAnswer;
  else if (typeof rawAnswer === 'string') {
    idx = /^\d+$/.test(rawAnswer.trim()) ? Number(rawAnswer) : options.findIndex((o) => o.toLowerCase() === rawAnswer.trim().toLowerCase());
  }
  if (idx < 0 || idx >= options.length) return null; // can't tell which option is right -> unusable

  // Models bias the correct answer toward a fixed position, so shuffle and remap the index.
  const correctText = options[idx];
  const shuffled = shuffle(options);
  return {
    question,
    options: shuffled,
    answerIndex: shuffled.indexOf(correctText),
    explanation: str(q?.explanation),
  };
}

/**
 * @returns {{ deck: {title, flashcards, quiz}, dropped: number }}
 * @throws {DeckError}
 */
export function parseDeck(raw) {
  const data = extractJson(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new DeckError('shape', 'The AI response was not in the expected format.');
  }
  const rawCards = Array.isArray(data.flashcards) ? data.flashcards : [];
  const rawQuiz = Array.isArray(data.quiz) ? data.quiz : [];
  if (!Array.isArray(data.flashcards) && !Array.isArray(data.quiz)) {
    throw new DeckError('shape', 'The AI response was missing flashcards and quiz questions.');
  }

  const flashcards = rawCards.map(cleanCard).filter(Boolean);
  const quiz = rawQuiz.map(cleanQuestion).filter(Boolean);
  const dropped = rawCards.length - flashcards.length + (rawQuiz.length - quiz.length);

  if (!flashcards.length && !quiz.length) {
    throw new DeckError('nothing_usable', 'The AI response had no usable flashcards or questions.');
  }
  return { deck: { title: str(data.title) || 'Study set', flashcards, quiz }, dropped };
}
