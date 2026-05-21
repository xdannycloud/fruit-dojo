import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App.jsx';

describe('Cursor Agent Pet', () => {
  it('renders the title', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /cursor agent pet/i })
    ).toBeInTheDocument();
  });

  it('changes mood to excited when the stage is clicked', () => {
    render(<App />);
    const stage = screen.getByTestId('stage');
    const mood = screen.getByTestId('mood-indicator');

    expect(mood).toHaveTextContent(/idle/i);

    act(() => {
      fireEvent.click(stage, { clientX: 200, clientY: 200 });
    });

    expect(screen.getByTestId('mood-indicator')).toHaveTextContent(/excited/i);
    expect(screen.getByTestId('pet')).toHaveAttribute('data-mood', 'excited');
  });

  it('toggles focus mode and updates the resting mood', () => {
    render(<App />);
    const toggle = screen.getByTestId('focus-toggle');

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('mood-indicator')).toHaveTextContent(/idle/i);

    act(() => {
      fireEvent.click(toggle);
    });

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('mood-indicator')).toHaveTextContent(/focused/i);
    expect(toggle).toHaveTextContent(/focus on/i);

    act(() => {
      fireEvent.click(toggle);
    });

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('mood-indicator')).toHaveTextContent(/idle/i);
  });

  it('spawns a thought bubble when the stage is clicked', () => {
    render(<App />);
    const stage = screen.getByTestId('stage');

    act(() => {
      fireEvent.click(stage, { clientX: 150, clientY: 150 });
    });

    const bubbles = document.querySelectorAll('.bubble');
    expect(bubbles.length).toBeGreaterThan(0);
  });
});
