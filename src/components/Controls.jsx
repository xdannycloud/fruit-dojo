import React from 'react';

export default function Controls({ focusMode, onToggleFocus, mood }) {
  return (
    <header className="controls">
      <div className="controls__brand">
        <span className="controls__logo" aria-hidden="true">◆</span>
        <h1 className="controls__title">Cursor Agent Pet</h1>
      </div>
      <p className="controls__hint">
        Move your cursor. Click anywhere. Toggle <kbd>Focus</kbd> when it's time to ship.
      </p>
      <div className="controls__row">
        <span
          className={`mood mood--${mood}`}
          data-testid="mood-indicator"
          aria-label={`Pet mood: ${mood}`}
        >
          <span className="mood__dot" aria-hidden="true" />
          {mood}
        </span>
        <button
          type="button"
          className={`toggle ${focusMode ? 'toggle--on' : ''}`}
          onClick={onToggleFocus}
          aria-pressed={focusMode}
          aria-label="Toggle focus mode"
          data-testid="focus-toggle"
        >
          <span className="toggle__track" aria-hidden="true">
            <span className="toggle__thumb" />
          </span>
          <span className="toggle__label">
            {focusMode ? 'Focus on' : 'Focus off'}
          </span>
        </button>
      </div>
    </header>
  );
}
