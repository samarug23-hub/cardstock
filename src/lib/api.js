export class ApiError extends Error {
  constructor(message, { retryable = true, code = 'api' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.retryable = retryable;
    this.code = code;
  }
}

/** Asks the backend proxy for a raw model response. Resolves to the raw text (parsed elsewhere). */
export async function requestDeck(text, signal) {
  let res;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the server. Check your connection and that the API is running.', { code: 'network' });
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON body; handled below
  }

  if (!res.ok) {
    const code = body?.code || 'server';
    // Bad input / config problems won't fix themselves on retry.
    const retryable = !['bad_input', 'too_long', 'no_key', 'config'].includes(code);
    throw new ApiError(body?.error || `Request failed (${res.status}).`, { retryable, code });
  }
  return body?.text;
}
