type PageErrorProps = {
  title?: string
  message?: string
  error?: unknown
}

export default function PageError({
  title = 'Something went wrong',
  message = 'An unexpected error occurred.',
  error,
}: PageErrorProps) {
  if (error && process.env.NODE_ENV === 'development') {
    console.error('[PageError]', error)
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24">
      <h1 className="font-serif text-2xl font-bold text-text-title">{title}</h1>
      <p className="mt-2 text-brown-900/70">{message}</p>
    </div>
  )
}
