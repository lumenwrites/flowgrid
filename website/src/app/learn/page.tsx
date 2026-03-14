'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { faDiscord } from '@fortawesome/free-brands-svg-icons'
import Video from '@/components/ui/Video'

const TUTORIALS = [
  { slug: '01-learn-how-to-freestyle-rap-in-5-minutes-per-day' },
  { slug: '02-the-easiest-freestyle-rap-exercise-for-beginners' },
  { slug: '03learn-a-new-rap-flow-in-4-easy-steps' },
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

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Freestyle Rap Tutorials
            </h1>
            <p className="text-foreground-muted">
              Learn to freestyle rap in 5 minutes per day
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TUTORIALS.map((video) => (
              <button
                key={video.slug}
                onClick={() => setActiveVideo(video.slug)}
                className="group rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/10"
              >
                <div className="relative">
                  <Image
                    src={`/tutorials/${video.slug}.png`}
                    alt="Tutorial"
                    width={480}
                    height={270}
                    className="w-full aspect-video object-cover group-hover:brightness-110 transition-all"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#7c5cfc">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-16 mb-4">
            <div className="border border-border rounded-2xl bg-surface p-6 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Want to freestyle rap but don&apos;t know where to start?
              </h2>
              <p className="text-foreground-muted mb-6 max-w-md mx-auto">
                I&apos;ll guide you through the basics step by step - and send you weekly tips to keep you improving
              </p>
              {submitState === 'success' ? (
                <p className="text-green-400 font-semibold py-2">You&apos;re in! Check your inbox.</p>
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
                  className="flex flex-col items-center gap-3 max-w-sm mx-auto"
                >
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Enter your email..."
                      className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={submitState === 'loading'}
                      className="px-5 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {submitState === 'loading' ? 'Signing up...' : 'Sign up'}
                    </button>
                    <a
                      href="https://discord.gg/z3AmD8UMVG"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-3 py-2.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors"
                      aria-label="Join Discord"
                    >
                      <FontAwesomeIcon icon={faDiscord} className="text-lg" />
                    </a>
                  </div>
                  {submitState === 'error' && (
                    <p className="text-red-400 text-sm">{errorMsg}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setActiveVideo(null)} />
          <div className="relative w-[90vw] max-w-3xl">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm"
            >
              Close
            </button>
            <Video
              url={`/tutorials/${activeVideo}.mp4`}
              poster={`/tutorials/${activeVideo}.png`}
            />
          </div>
        </div>
      )}
    </div>
  )
}
