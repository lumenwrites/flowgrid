import Container from '@/components/Layout/Container'
import PostBox from '@/components/Posts/PostBox'

const samplePosts = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description:
      'Welcome to the project. This is a sample post to demonstrate the layout and styling. Replace this with real content once your backend is connected.',
    tags: [
      { name: 'Guide', slug: 'guide' },
      { name: 'Setup', slug: 'setup' },
    ],
  },
  {
    slug: 'design-system',
    title: 'Design System',
    description:
      'This starter uses a warm literary aesthetic with parchment tones, serif headings, and Georgia body text. Customize the theme tokens in globals.css to match your project.',
    tags: [
      { name: 'Design', slug: 'design' },
      { name: 'Tailwind', slug: 'tailwind' },
    ],
  },
  {
    slug: 'architecture-notes',
    title: 'Architecture Notes',
    description:
      'The codebase follows a feature-based component structure with typed API wrappers, Supabase RPC patterns, and a route-group layout. See the references/ folder for full conventions.',
    tags: [
      { name: 'Architecture', slug: 'architecture' },
      { name: 'Next.js', slug: 'nextjs' },
    ],
  },
]

export default function Home() {
  return (
    <Container className="mt-4 flex flex-col gap-2">
      {samplePosts.map((post) => (
        <PostBox key={post.slug} post={post} />
      ))}
    </Container>
  )
}
