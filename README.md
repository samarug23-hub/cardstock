# Cardstock — notes → flashcards + quiz

A small React app for the Frontend Internship Assignment (**Study assistant** option). Paste notes or a topic; an LLM returns **structured JSON**; the app validates it and renders interactive flashcards (flip, mark known, filter) and a quiz (instant feedback, score, **re-test missed questions**). It is not a chatbot: raw model text is never displayed.

## Setup

Requires Node 18+.

```bash
cp .env.example .env     # then add ONE provider key (Gemini has a free tier)
npm install && npm start
```

Open http://localhost:5173. `npm start` runs the Vite dev server and the Express proxy together. `npm test` runs the parser tests.

Providers (`PROVIDER` in `.env`): `gemini`, `anthropic`, or `openai` (any OpenAI-compatible API: Groq, OpenRouter, or local **Ollama** with `OPENAI_BASE_URL=http://localhost:11434/v1`).

## Architecture

```
server/index.js            Express proxy. Holds the API key, validates input size, 45s timeout,
                           aborts upstream call if the client disconnects. Returns { text }.
src/lib/api.js             fetch wrapper -> typed ApiError (retryable or not)
src/lib/parseDeck.js       extractJson() + parseDeck(): untrusted text -> trusted deck
src/hooks/useDeckGenerator request lifecycle: idle/loading/success/error, cancel, retry
src/components/            InputPanel, Flashcards, Quiz, StatusViews
tests/parseDeck.test.js    bad-output cases
```

The server returns raw text on purpose: parsing and validation live in one place on the client where they are unit-tested, and the UI only ever sees a validated deck.

## Handling bad AI output

| Failure | Behaviour |
|---|---|
| Empty response | `empty` error, retry button |
| Malformed / truncated JSON | Strip ``` fences and surrounding chatter, then try the outermost `{…}`; otherwise `malformed` error + retry |
| Wrong shape (array, missing keys) | `shape` error + retry |
| Some items invalid (missing fields, 1 option, answer index out of range) | Those items are **dropped**, the rest are used, and a notice says how many were skipped |
| Nothing usable left | `nothing_usable` error + retry |
| Answer given as text or `"2"` instead of an index | Normalised to an index |
| Model always puts the right answer first | Options are shuffled and the index remapped |
| Slow | 45s server timeout, 60s client timeout, Cancel button |
| Network / rate limit / missing key | Specific message; no retry button when retrying can't help (bad input, missing key) |
| **Stale response** | Every request gets an id; only the latest id may update state, and the previous request is aborted. Cancel also invalidates the in-flight request |
| Regeneration fails | Previous deck stays on screen under the error |

## AI-usage note

_Edit this to be accurate for you; being honest counts in your favour._ I used Claude to generate the first draft of the scaffolding, components, and CSS. I [read / tested / changed: fill in] each file, and I can explain the request-id/abort logic in `useDeckGenerator`, why validation drops items instead of failing wholesale, and how the quiz re-test sessions work.

## Known limitations

- No streaming, no persistence (a refresh loses the deck), no refinement loop.
- The model can still produce a *factually wrong* but well-formed question; validation checks shape, not truth.
- Input capped at 8,000 characters; no file/PDF upload.
- Only the happy path and parser are tested; there are no component or end-to-end tests.
- Dev setup only; production would serve `dist/` from the Express server or deploy `/api/generate` as a serverless function.

## What I'd do next

Stream the response and render cards as they arrive; save sessions to `localStorage`; a follow-up box that edits the deck ("make these harder"); a "regenerate just this card" action; component tests with Vitest + Testing Library.

## Time spent

_Fill in honestly (target ≤ 8h)._
