import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-4">
      <div className="max-w-md rounded-md border border-line bg-white p-8 text-center shadow-panel">
        <p className="text-sm font-medium text-brand">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The page you opened is not part of this workspace.</p>
        <Link
          to="/"
          className="focus-ring mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-brand bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
