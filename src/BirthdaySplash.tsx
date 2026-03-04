import React from 'react';

type BirthdaySplashProps = {
  onStartCreating: () => void;
};

const sparklePositions = [
  { left: '8%', top: '18%', delay: '0s', size: '18px' },
  { left: '20%', top: '65%', delay: '0.4s', size: '12px' },
  { left: '34%', top: '28%', delay: '1.1s', size: '16px' },
  { left: '50%', top: '80%', delay: '0.7s', size: '10px' },
  { left: '63%', top: '20%', delay: '1.6s', size: '20px' },
  { left: '76%', top: '56%', delay: '0.2s', size: '14px' },
  { left: '88%', top: '25%', delay: '1.3s', size: '17px' },
  { left: '92%', top: '72%', delay: '0.9s', size: '11px' },
];

export default function BirthdaySplash({ onStartCreating }: BirthdaySplashProps) {
  return (
    <main className="birthday-splash" aria-label="Birthday splash page">
      <div className="birthday-glow" />
      {sparklePositions.map((sparkle, index) => (
        <span
          key={index}
          className="birthday-sparkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: sparkle.delay,
            width: sparkle.size,
            height: sparkle.size,
          }}
          aria-hidden="true"
        />
      ))}

      <section className="birthday-card">
        <p className="birthday-subtitle">You Shine Bright</p>
        <h1 className="birthday-title">Happy 10th Birthday</h1>
        <button type="button" className="birthday-start-button" onClick={onStartCreating}>
          Start Creating
        </button>
      </section>
    </main>
  );
}
