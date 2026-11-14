import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeck, DeckError } from '../src/lib/parseDeck.js';

const good = {
  title: 'Cells',
  flashcards: [{ front: 'Powerhouse?', back: 'Mitochondria' }],
  quiz: [{ question: 'Q?', options: ['a', 'b', 'c', 'd'], answerIndex: 2, explanation: 'because' }],
};
const code = (fn) => { try { fn(); } catch (e) { return e instanceof DeckError ? e.code : 'other:' + e.message; } return 'no-throw'; };

test('parses clean JSON', () => {
  const { deck, dropped } = parseDeck(JSON.stringify(good));
  assert.equal(deck.flashcards.length, 1);
  assert.equal(dropped, 0);
});

test('strips markdown fences and surrounding chatter', () => {
  assert.equal(parseDeck('```json\n' + JSON.stringify(good) + '\n```').deck.title, 'Cells');
  assert.equal(parseDeck('Sure! Here you go:\n' + JSON.stringify(good) + '\nHope it helps').deck.title, 'Cells');
});

test('shuffling keeps the correct answer correct', () => {
  for (let i = 0; i < 50; i++) {
    const q = parseDeck(JSON.stringify(good)).deck.quiz[0];
    assert.equal(q.options[q.answerIndex], 'c');
  }
});

test('accepts answer as text or numeric string', () => {
  const q = (answerIndex) => JSON.stringify({ ...good, quiz: [{ ...good.quiz[0], answerIndex }] });
  for (const a of ['c', '2']) {
    const quiz = parseDeck(q(a)).deck.quiz[0];
    assert.equal(quiz.options[quiz.answerIndex], 'c');
  }
});

test('drops invalid items but keeps valid ones', () => {
  const messy = {
    ...good,
    flashcards: [...good.flashcards, { front: '', back: 'x' }, { front: 'y' }, null],
    quiz: [...good.quiz, { question: 'bad', options: ['only one'], answerIndex: 0 }, { question: 'oob', options: ['a', 'b'], answerIndex: 9 }],
  };
  const { deck, dropped } = parseDeck(JSON.stringify(messy));
  assert.equal(deck.flashcards.length, 1);
  assert.equal(deck.quiz.length, 1);
  assert.equal(dropped, 5);
});

test('fails with a specific code for each kind of bad output', () => {
  assert.equal(code(() => parseDeck('')), 'empty');
  assert.equal(code(() => parseDeck(undefined)), 'empty');
  assert.equal(code(() => parseDeck('{"title": "cut off", "flashcards": [{"fr')), 'malformed');
  assert.equal(code(() => parseDeck('[1,2,3]')), 'shape');
  assert.equal(code(() => parseDeck('{"hello":"world"}')), 'shape');
  assert.equal(code(() => parseDeck('{"flashcards":[],"quiz":[]}')), 'nothing_usable');
});
