import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <p className="eyebrow">404 · A little detour</p>
      <h1>The celebration is over here.</h1>
      <p>This page doesn’t exist. Head back to your planning studio.</p>
      <Link className="button primary" href="/">
        Back to RavelNest
      </Link>
    </main>
  );
}
