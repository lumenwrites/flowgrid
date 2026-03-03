import Link from 'next/link'
import { cn } from '@/lib/utils'

type Post = {
  tags?: { name: string; slug: string }[]
}

type PostFooterProps = {
  post: Post
  className?: string
}

export default function PostFooter({ post, className = '' }: PostFooterProps) {
  if (!post.tags?.length) return null
  return (
    <div
      className={cn(
        'px-2 sm:px-3 py-1 flex gap-2 border-t text-text-title border-border/50 bg-bg-title/20 text-sm rounded-b',
        className
      )}
    >
      <div className="flex gap-1">
        {post.tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/tag/${tag.slug}`}
            className="flex items-center gap-1 rounded bg-bg-title border border-border/50 px-1.5 py-0.5 text-text-title/90 text-sm font-serif hover:bg-[#ffddaa]"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
