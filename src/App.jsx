import { useState } from 'react';
import { useDeckGenerator } from './hooks/useDeckGenerator.js';
import InputPanel from './components/InputPanel.jsx';
import Flashcards from './components/Flashcards.jsx';
import Quiz from './components/Quiz.jsx';
import { LoadingView, EmptyView, ErrorBanner } from './components/StatusViews.jsx';

export default function App() {
  const { status, deck, error, notice, generate, retry, cancel } = useDeckGenerator();
  const [tab, setTab] = useState('cards');
  const loading = status === 'loading';

  return (
    <main className="app">
      <header className="masthead">
        <h1>Cardstock</h1>
        <p>Turn notes into flashcards and a quiz.</p>
      </header>

      <InputPanel loading={loading} onSubmit={generate} onCancel={cancel} />

      {status === 'error' && <ErrorBanner error={error} onRetry={retry} hasDeck={!!deck} />}
      {notice && <p className="notice" role="status">{notice}</p>}

      {loading ? (
        <LoadingView />
      ) : !deck ? (
        status !== 'error' && <EmptyView />
      ) : (
        <section className="deck" aria-label={deck.title}>
          <h2 className="deck-title">{deck.title}</h2>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'cards'} className={tab === 'cards' ? 'on' : ''} onClick={() => setTab('cards')}>
              Flashcards ({deck.flashcards.length})
            </button>
            <button role="tab" aria-selected={tab === 'quiz'} className={tab === 'quiz' ? 'on' : ''} onClick={() => setTab('quiz')}>
              Quiz ({deck.quiz.length})
            </button>
          </div>
          {/* key={deck.id} resets all card/quiz state whenever a new deck arrives */}
          {/* Both stay mounted (just hidden) so switching tabs doesn't lose quiz progress. */}
          <div role="tabpanel" hidden={tab !== 'cards'}><Flashcards key={deck.id} cards={deck.flashcards} /></div>
          <div role="tabpanel" hidden={tab !== 'quiz'}><Quiz key={deck.id} questions={deck.quiz} /></div>
        </section>
      )}
    </main>
  );
}
