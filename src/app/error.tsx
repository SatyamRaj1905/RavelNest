'use client';

import { Flower2 } from 'lucide-react';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <Flower2 size={40} />
      <h1>Let’s take a fresh breath.</h1>
      <p>
        Something interrupted your workspace. Your saved browser plans are still
        yours.
      </p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
