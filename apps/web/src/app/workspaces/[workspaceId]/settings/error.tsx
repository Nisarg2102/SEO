'use client';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 border border-red-200 bg-red-50 rounded-lg max-w-2xl mt-12 mx-auto">
      <h1 className="text-xl font-bold text-red-900 mb-2">Settings couldn&apos;t load</h1>
      <p className="text-red-800 mb-4">
        Something went wrong while loading or displaying your settings.
      </p>
      {error.message && (
        <pre className="text-xs bg-red-100 p-2 rounded text-red-900 mb-4 whitespace-pre-wrap">
          {error.message}
        </pre>
      )}
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}
