'use client'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="font-serif text-3xl font-bold text-text-title">Something went wrong</h1>
      <p className="mt-2 text-brown-900/70">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded bg-orange-cta px-4 py-2 text-white hover:bg-orange-cta-hover"
      >
        Try again
      </button>
    </div>
  )
}
