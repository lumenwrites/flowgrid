import Image from 'next/image'
import Link from 'next/link'
import Container from './Container'

export default function Header() {
  return (
    <div className="relative z-10 border-t-2 border-orange-600 bg-white font-serif shadow">
      <Container className="flex flex-row items-center justify-between py-2 text-slate-600">
        <Link href="/" className="flex items-center">
          <Image
            src="/img/logo.png"
            width={32}
            height={32}
            alt="logo"
            className="mr-2"
          />
          <span className="font-serif text-xl font-bold">
            ProjectTitle
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/about"
            className="rounded border border-slate-300 px-3 py-1 text-slate-600 hover:bg-slate-50"
          >
            About
          </Link>
        </nav>
      </Container>
    </div>
  )
}
