import { cn } from '@/lib/utils'
import Link from 'next/link'
import PostFooter from './PostFooter'

type Post = {
  slug: string
  title: string
  description: string
  tags?: { name: string; slug: string }[]
}

type PostBoxProps = {
  post: Post
  className?: string
}

export default function PostBox({ post, className = '' }: PostBoxProps) {
  return (
    <div className={cn('rounded overflow-hidden bg-page shadow', className)}>
      <div className="h-1 bg-gradient-to-t from-[#bc5b15] to-[#f3a533]" />
      {post.title && (
        <Link
          href={`/post/${post.slug}`}
          className="block px-2 sm:px-3 py-1 font-serif text-base sm:text-xl font-bold text-text-title border-b border-border bg-bg-title"
        >
          {post.title}
        </Link>
      )}
      <div className="px-2 sm:px-3 py-2 font-georgia text-base md:text-lg text-brown-900 leading-relaxed">
        <p>{post.description}</p>
      </div>
      <PostFooter post={post} />
    </div>
  )
}
