import { useCallback, useEffect, useRef, useState } from 'react';
import { requestDeck, ApiError } from '../lib/api.js';
import { parseDeck, DeckError } from '../lib/parseDeck.js';

const CLIENT_TIMEOUT_MS = 60_000;

const PARSE_MESSAGES = {
  empty: 'The AI returned nothing. Try again, or add more detail to your notes.',
  malformed: 'The AI response was garbled or cut off. Trying again usually fixes it.',
  shape: 'The AI answered in the wrong format. Trying again usually fixes it.',
  nothing_usable: 'The AI response had no usable cards or questions. Try again or give it more material.',
};

/**
 * Owns the request lifecycle: idle -> loading -> success | error.
 * Guarantees a stale response can never overwrite a newer one (request ids + AbortController),
 * and keeps the previous deck on screen if a regeneration fails.
 */
export function useDeckGenerator() {
  const [state, setState] = useState({ status: 'idle', deck: null, error: null, notice: null });
  const latestId = useRef(0);
  const controllerRef = useRef(null);
  const lastInput = useRef('');

  const generate = useCallback(async (text) => {
    lastInput.current = text;
    controllerRef.current?.abort(); // cancel the superseded request
    const id = ++latestId.current;
    const controller = new AbortController();
    controllerRef.current = controller;

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    setState((s) => ({ ...s, status: 'loading', error: null, notice: null }));

    try {
      const raw = await requestDeck(text, controller.signal);
      if (id !== latestId.current) return; // a newer request owns the UI now
      const { deck, dropped } = parseDeck(raw);
      setState({
        status: 'success',
        deck: { ...deck, id },
        error: null,
        notice: dropped ? `${dropped} malformed item${dropped > 1 ? 's were' : ' was'} skipped.` : null,
      });
    } catch (err) {
      if (id !== latestId.current) return;
      let error;
      if (err.name === 'AbortError' && timedOut) {
        error = { message: 'The AI is taking too long. Try again.', retryable: true };
      } else if (err instanceof DeckError) {
        error = { message: PARSE_MESSAGES[err.code] || err.message, retryable: true };
      } else if (err instanceof ApiError) {
        error = { message: err.message, retryable: err.retryable };
      } else {
        error = { message: 'Something went wrong. Try again.', retryable: true };
      }
      setState((s) => ({ ...s, status: 'error', error }));
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const retry = useCallback(() => generate(lastInput.current), [generate]);

  const cancel = useCallback(() => {
    latestId.current++; // invalidate whatever is in flight
    controllerRef.current?.abort();
    setState((s) => ({ ...s, status: s.deck ? 'success' : 'idle', error: null }));
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...state, generate, retry, cancel };
}
