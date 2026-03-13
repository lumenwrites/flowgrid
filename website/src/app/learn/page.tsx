'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

const TUTORIALS = [
  { id: 'aHPgwwm23is' },
  { id: 'yYwUUSFQL3k' },
  { id: 'HwXqXRoB0FQ' },
]

export default function LearnPage() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center gap-3 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] bg-surface border-b border-border">
        <Link
          href="/"
          className="p-1.5 rounded hover:bg-surface-light transition-colors text-foreground-muted hover:text-foreground"
          aria-label="Back"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
        <Link href="/" className="text-sm font-bold text-accent tracking-wider hover:text-accent/80 transition-colors">
          FLOWGRID
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <h1 className="text-2xl font-bold text-foreground text-center mt-4 mb-6">
          Freestyle Rap Tutorials
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {TUTORIALS.map((video) => (
            <button
              key={video.id}
              onClick={() => setActiveVideo(video.id)}
              className="rounded-lg overflow-hidden hover:ring-2 hover:ring-accent transition-all"
            >
              <Image
                src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                alt="Tutorial"
                width={480}
                height={270}
                className="w-full aspect-video object-cover"
              />
            </button>
          ))}
        </div>

        <div className="max-w-lg mx-auto mt-12 mb-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Want to freestyle rap but don&apos;t know where to start?
          </h2>
          <p className="text-foreground-muted mb-5">
            I&apos;ll guide you through the basics step by step — and send you weekly tips to keep you improving
          </p>
          {submitState === 'success' ? (
            <p className="text-green-400 font-semibold">You&apos;re in! Check your inbox.</p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget
                const email = new FormData(form).get('email') as string
                if (!email) return
                setSubmitState('loading')
                try {
                  const res = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  })
                  const data = await res.json()
                  if (!res.ok || data.error) {
                    setErrorMsg(data.error || 'Something went wrong.')
                    setSubmitState('error')
                  } else {
                    form.reset()
                    setSubmitState('success')
                  }
                } catch {
                  setErrorMsg('Something went wrong.')
                  setSubmitState('error')
                }
              }}
              className="flex flex-col items-center gap-2 max-w-sm mx-auto"
            >
              <div className="flex gap-2 w-full">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-light border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="submit"
                  disabled={submitState === 'loading'}
                  className="px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {submitState === 'loading' ? 'Signing up...' : 'Sign up'}
                </button>
              </div>
              {submitState === 'error' && (
                <p className="text-red-400 text-sm">{errorMsg}</p>
              )}
            </form>
          )}
        </div>
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setActiveVideo(null)} />
          <div className="relative w-[90vw] max-w-3xl aspect-video">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm"
            >
              Close
            </button>
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}
