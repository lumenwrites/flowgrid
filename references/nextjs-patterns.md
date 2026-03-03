# Next.js + Supabase App Patterns

Standards and patterns for a Next.js App Router application backed by Supabase. All examples use a generic blogging/community platform.

---

## Table of Contents

- [Directory Structure](#directory-structure)
- [Supabase Client Setup](#supabase-client-setup)
- [API Layer](#api-layer)
- [Types](#types)
- [Server Components (Pages)](#server-components-pages)
- [Error Handling](#error-handling)
- [Forms (react-hook-form + Zod)](#forms-react-hook-form--zod)
- [Toast Notifications](#toast-notifications)
- [Hooks](#hooks)
- [Proxy (Auth + Route Protection)](#proxy-auth--route-protection)
- [Auth Callback Route](#auth-callback-route)
- [Layout Structure](#layout-structure)
- [Component Organization](#component-organization)
- [Styling](#styling)
- [Key Libraries](#key-libraries)
- [Config](#config)

---

## Directory Structure

```
src/
  api/              -- Typed RPC wrappers (one file per domain)
  app/              -- Next.js App Router
    (main-layout)/  -- Route group with shared header/footer layout
    auth/callback/  -- OAuth callback route
    error.tsx       -- Global error boundary
    layout.tsx      -- Root layout (providers, fonts, toaster)
  components/       -- Feature-based folders
    layout/         -- Header, Footer, Container
    ui/             -- Shared UI (PageError, Toast, Toaster, etc.)
    posts/          -- Post-related components
    comments/       -- Comment components
    settings/       -- Settings page components
    auth/           -- Login/signup forms
  hooks/            -- Custom hooks (useDebounce, useToast, etc.)
  lib/
    utils.ts        -- cn(), formatDate(), getErrorMessage(), getSafeRedirectPath()
    supabase/
      server.ts     -- createSupabaseServerClient()
      proxy.ts      -- updateSession() for proxy
      types.ts      -- CustomSupabaseClient type
  types/
    index.ts        -- Shared TypeScript types
  styles/
    globals.css     -- Tailwind theme + global styles
  proxy.ts          -- Route protection entry point (Next.js 16 renamed middleware to proxy)
```

---

## Supabase Client Setup

### Custom type

Define a typed Supabase client used everywhere:

```typescript
// lib/supabase/types.ts
import { SupabaseClient } from '@supabase/supabase-js'

type Database = {
  myapp: {
    Tables: object;
    Views: object;
    Functions: object;
  };
}

type CustomSupabaseClient = SupabaseClient<Database, 'myapp'>
```

### Server client

Used in server components and API routes. Uses `cookies()` from `next/headers`:

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient(): Promise<CustomSupabaseClient> {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch { /* called from Server Component, ignore */ }
        },
      },
      db: { schema: 'myapp' },
    },
  ) as CustomSupabaseClient
}
```

### Browser client

Used in client components. Create via `createBrowserClient` from `@supabase/ssr`. Access it through `createSupabaseBrowserClient()` (no provider/context needed — just call the function directly).

---

## API Layer

Every domain (posts, comments, profiles, etc.) gets its own file in `/src/api/`. Each file exports:

1. **Input/Output types** for every function
2. **Query functions** (reads) and **mutation functions** (writes)

All functions take `supabase: CustomSupabaseClient` as the first argument and call Supabase RPCs.

### Structure of an API file

```typescript
// api/posts.ts
import type { Post, Tag } from '@/types'
import type { CustomSupabaseClient } from '@/lib/supabase/types'

// QUERIES

export type GetPostInput = { postSlug: string }
export type GetPostOutput = { post: Post }

export async function getPost(
  supabase: CustomSupabaseClient,
  { postSlug }: GetPostInput,
): Promise<GetPostOutput> {
  const { data, error } = await supabase.rpc('get_post', {
    p_post_slug: postSlug,
  })
  if (error) throw error
  if (!data) throw new Error('Post not found')
  return { post: data as Post }
}

export type GetPostsInput = {
  searchText?: string;
  sortBy?: string;
  maxPosts?: number | null;
}

export type GetPostsOutput = {
  posts: Post[];
  totalCount: number;
}

export async function getPosts(
  supabase: CustomSupabaseClient,
  { searchText = '', sortBy = 'hot', maxPosts = null }: GetPostsInput = {},
): Promise<GetPostsOutput> {
  const { data, error, count } = await supabase
    .rpc('get_posts', { p_sort_by: sortBy, p_search_text: searchText || null }, { count: 'exact' })
    .range(0, (maxPosts ?? 20) - 1)
  if (error) throw error
  return { posts: data, totalCount: count as number }
}

// MUTATIONS

export type CreatePostInput = {
  title: string;
  slug: string;
  content: string;
  tagIds: string[];
}

export type CreatePostOutput = { postId: string }

export async function createPost(
  supabase: CustomSupabaseClient,
  input: CreatePostInput,
): Promise<CreatePostOutput> {
  const { data, error } = await supabase.rpc('post_create', {
    p_title: input.title,
    p_slug: input.slug,
    p_content: input.content,
    p_tag_ids: input.tagIds,
  })
  if (error) throw error
  return { postId: data }
}

export async function deletePost(
  supabase: CustomSupabaseClient,
  { postId }: { postId: string },
): Promise<void> {
  const { error } = await supabase.rpc('post_delete', { p_post_id: postId })
  if (error) throw error
}
```

### Key conventions

- **Input types use camelCase**, RPC parameters use `p_snake_case` — the API layer maps between them
- **Queries** return `{ entity: T }` or `{ entities: T[], totalCount: number }`
- **Mutations** that create return `{ entityId: string }`, updates/deletes return `void`
- **`if (error) throw error`** — always throw Supabase errors, let the caller handle them
- **`data ?? []`** for list queries to avoid null
- Section comments `// QUERIES` and `// MUTATIONS` separate read and write operations

---

## Types

All shared TypeScript types live in `/src/types/index.ts`. Use `type` (not `interface`).

```typescript
export type Profile = {
  id: string;
  created_at: string;
  username: string | null;
  avatar: string | null;
  description: string | null;
  is_admin: boolean | null;
}

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  likes_count: number;
  draft: boolean;
  created_at: string;
  tags: Tag[];
  authors: { id: string; username: string }[];
  is_liked: boolean;
  is_author: boolean;
}

export type Tag = {
  id: string;
  title: string;
  slug: string;
}

export type Collection = {
  id: string;
  name: string;
  is_public: boolean;
  post_count: number;
}
```

Types mirror the shape returned by RPCs. Nested objects (authors, tags) use inline types or reference other exported types.

---

## Server Components (Pages)

Pages are async server components that fetch data via the API layer.

### Basic page pattern

```typescript
import Container from '@/components/layout/Container'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getPosts } from '@/api/posts'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()

  const { posts: featuredPosts } = await getPosts(supabase, {
    sortBy: 'top',
    maxPosts: 9,
  })

  const { posts: newPosts } = await getPosts(supabase, {
    sortBy: 'new',
    maxPosts: 9,
  })

  return (
    <Container>
      {/* render sections with fetched data */}
    </Container>
  )
}
```

### Page with error handling (PageError)

For expected "not found" scenarios, catch the error and render `<PageError>` inline:

```typescript
import PageError from '@/components/ui/PageError'
import { getPost } from '@/api/posts'

export default async function PostPage({ params }: { params: { postSlug: string } }) {
  const supabase = await createSupabaseServerClient()

  let postData
  try {
    const { post } = await getPost(supabase, { postSlug: params.postSlug })
    postData = post
  } catch (error) {
    return (
      <PageError
        title="Post not found"
        message="This post doesn't exist or has been removed."
        error={error}
      />
    )
  }

  return (
    <Container>
      {/* render postData */}
    </Container>
  )
}
```

### Page with auth check + redirect

For pages that require auth beyond what the proxy handles:

```typescript
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error } = await supabase.auth.getUser()

  if (!userData?.user || error) {
    redirect('/')
  }

  const { profile } = await getMyProfile(supabase)

  return (
    <Container>
      <Settings profileData={profile} />
    </Container>
  )
}
```

### Thin page, heavy component

Some pages are just thin wrappers that delegate to a client component:

```typescript
// app/(main-layout)/browse/page.tsx
export default async function BrowsePage({ searchParams }) {
  return <Browse searchParams={searchParams} />
}
```

---

## Error Handling

### Two tiers

1. **`<PageError>`** — inline, user-friendly. Renders in place of page content for expected failures (not found, no permission).
2. **`error.tsx`** — global error boundary. Catches unexpected/unhandled errors. Shows a generic error card with the error message (and stack trace in dev).

### In client components / forms

Wrap API calls in try/catch. Use `getErrorMessage()` to extract the message, display with `toast()`:

```typescript
try {
  await createPost(supabase, input)
  toast({ title: 'Success', description: 'Post created', variant: 'success' })
  router.push(`/post/${input.slug}`)
} catch (err) {
  toast({
    title: 'Error',
    description: getErrorMessage(err, 'Failed to save post'),
    variant: 'danger',
  })
}
```

### `getErrorMessage` utility

```typescript
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  return fallback
}
```

### `PageError` component

A simple card with an icon, title, and message. Logs the error in a useEffect:

```typescript
type PageErrorProps = {
  title?: string;
  message: string;
  error?: unknown;
  className?: string;
}
```

---

## Forms (react-hook-form + Zod)

### Standard form pattern

```typescript
'use client'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Form from '@/components/ui/Form'
import { useToast } from '@/hooks/useToast'
import { getErrorMessage } from '@/lib/utils'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  tagIds: z.array(z.string().uuid()).min(1, 'At least one tag is required'),
})

type FormValues = z.infer<typeof formSchema>

export default function PostForm({ postData }: { postData?: Post }) {
  const supabase = useSupabaseBrowserClient()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: postData?.title || '',
      slug: postData?.slug || '',
      content: postData?.content || '',
      tagIds: postData?.tags?.map(t => t.id) || [],
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      if (postData) {
        await updatePost(supabase, { ...values, postId: postData.id })
      } else {
        await createPost(supabase, values)
      }
      toast({ title: 'Success', description: 'Post saved', variant: 'success' })
      router.refresh()
      router.push(`/post/${values.slug}/edit`)
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err, 'Failed to save post'),
        variant: 'danger',
      })
    }
  }

  return (
    <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
      <Form.Field
        control={form.control}
        name="title"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Title</Form.Label>
            <Form.Input {...field} />
            <Form.Message />
          </Form.Item>
        )}
      />
      {/* more fields... */}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {postData ? 'Save' : 'Create Post'}
      </Button>
    </Form>
  )
}
```

### Key conventions

- `formSchema` defined at module level with `z.object()`
- `type FormValues = z.infer<typeof formSchema>`
- `useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: {...} })`
- `<Form.Message />` auto-displays validation errors — no props needed
- API errors go to `toast()`, not into form field errors (unless it's field-specific like a duplicate slug)
- Log `form.formState.errors` in a `useEffect` during dev to catch invisible validation failures
- Use the same form component for both create and edit mode, toggling behavior based on whether `existingData` is provided

### Async field validation (slug availability)

Use `useDebounce` + a `useEffect` to check things like slug availability without hammering the API:

```typescript
const [slugToCheck, setSlugToCheck] = useState(postData?.slug || '')
const { debouncedValue: debouncedSlug, isDebouncing } = useDebounce(slugToCheck, 500)
const [slugAvailability, setSlugAvailability] = useState<{
  checking: boolean;
  available?: boolean;
  error?: string;
}>({ checking: false })

useEffect(() => {
  if (!debouncedSlug) return
  async function check() {
    setSlugAvailability({ checking: true })
    try {
      const { isAvailable } = await checkSlugAvailability(supabase, {
        slug: debouncedSlug,
        currentId: postData?.id,
      })
      setSlugAvailability({ checking: false, available: isAvailable })
    } catch (err) {
      setSlugAvailability({ checking: false, error: getErrorMessage(err, 'Check failed') })
    }
  }
  check()
}, [debouncedSlug])
```

Disable the submit button while checking or when the slug is taken.

---

## Toast Notifications

Built on `@radix-ui/react-toast` + a custom `useToast` hook (reducer-based, no context needed).

### Usage

```typescript
import { useToast } from '@/hooks/useToast'

const { toast } = useToast()

// Success
toast({ title: 'Success', description: 'Post created', variant: 'success' })

// Error
toast({ title: 'Error', description: 'Something went wrong', variant: 'danger' })
```

### Variants

- `'success'` — green
- `'danger'` — red
- `'default'` — neutral

Duration defaults to 3 seconds. The `<Toaster />` component is mounted once in the root layout.

---

## Hooks

### `useDebounce`

Debounces any value. Returns the debounced value and a boolean indicating whether it's still waiting:

```typescript
const { debouncedValue, isDebouncing } = useDebounce(searchTerm, 300)
```

### `useToast`

Reducer-based toast state management. Returns `{ toasts, toast, dismiss }`. The `toast()` function can be called from anywhere — it uses module-level state, not React context.

---

## Proxy (Auth + Route Protection)

> **Important:** The proxy/middleware and auth setup changes frequently between Next.js and Supabase versions. Before writing or modifying these files, always look up the latest official examples:
> - Supabase SSR guide for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
> - Next.js proxy/middleware docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
> - Supabase Next.js quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
>
> Copy-paste from the official example and adapt, rather than writing from scratch.

Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function from `middleware` to `proxy`. The functionality is identical — the rename clarifies that this is a network-boundary proxy in front of the app, not Express-style middleware.

### Entry point

```typescript
// src/proxy.ts
import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### `updateSession`

In `lib/supabase/proxy.ts`:

1. Creates a Supabase server client that reads/writes cookies on the request/response
2. Calls `supabase.auth.getClaims()` to refresh the session (critical — don't remove this)
3. Checks protected routes and redirects unauthenticated users to `/login` with a `redirectTo` query param

**Why `getClaims()` instead of `getUser()`:** `getClaims()` validates the JWT locally against the project's public keys (cached), avoiding a database round-trip on every request. `getUser()` always hits the auth server, adding latency to every navigation. Both refresh expired tokens, but `getClaims()` is significantly faster.

```typescript
const protectedRoutes = ['/admin', '/post/create', '/settings', '/post/.+/edit']
const isProtectedRoute = protectedRoutes.some(route =>
  new RegExp(`^${route}`).test(request.nextUrl.pathname))

if (!user && isProtectedRoute) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/login'
  redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
  return NextResponse.redirect(redirectUrl)
}
```

---

## Auth Callback Route

Standard Supabase SSR auth code exchange:

```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${requestUrl.origin}/`)
}
```

### Safe redirects

Use a utility to prevent open redirect vulnerabilities:

```typescript
export function getSafeRedirectPath(redirectTo?: string) {
  if (!redirectTo) return '/'
  if (!redirectTo.startsWith('/')) return '/'
  if (redirectTo.startsWith('//')) return '/'
  const safePathRegex = /^\/[a-zA-Z0-9\-_/?=&]*$/
  if (!safePathRegex.test(redirectTo)) return '/'
  return redirectTo
}
```

---

## Layout Structure

### Root layout (`app/layout.tsx`)

Wraps the entire app with providers, fonts, and the toaster:

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('font-sans antialiased', fontSans.variable)}>
      <body>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <main className="flex min-h-screen flex-col bg-background">
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Route group layout (`app/(main-layout)/layout.tsx`)

Adds the header (and footer) to most pages. Pages that need a different chrome (iframes, auth pages) live outside this group.

```typescript
export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
      {/* <Footer /> */}
    </>
  )
}
```

### Container component

Constrains content width and adds horizontal padding:

```typescript
export default function Container({ children, className }) {
  return (
    <div className="px-2 sm:px-4">
      <div className={cn('m-auto max-w-screen-lg', className)}>
        {children}
      </div>
    </div>
  )
}
```

---

## Component Organization

Components are organized by feature, not by type:

```
components/
  layout/         -- Header, Footer, Container (structural)
  ui/             -- PageError, Toast, Toaster, Card, etc. (shared/generic)
  posts/          -- PostForm, PostCard, PostList
  comments/       -- Comments, Comment, CommentForm
  settings/       -- Settings, UpdateProfile, UpdateAvatar, DeleteAccount
  auth/           -- LoginForm, SignupForm
  collections/    -- CollectionActions, SaveToCollectionModal
```



---

## Styling

- **Tailwind CSS** with `cn()` utility (clsx + tailwind-merge) for conditional classes
- **FontAwesome** for icons (`@fortawesome/react-fontawesome`)
- Spacing: use `mt-*` for spacing between elements (not `space-y-*` or `mb-*`)
- Theme via CSS variables in `globals.css` with `@theme inline` (Tailwind v4) or `tailwind.config` (v3)

---

## Key Libraries

| Library | Purpose |
|---------|---------|
| `@supabase/ssr` | Server-side Supabase client (cookies-based auth) |
| `@supabase/supabase-js` | Supabase client |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod resolver for react-hook-form |
| `zod` | Schema validation |
| `@radix-ui/react-toast` | Toast primitives |
| `@radix-ui/react-dialog` | Modal/dialog primitives |
| `@fortawesome/react-fontawesome` | Icons |
| `class-variance-authority` | Component variant styling |
| `clsx` + `tailwind-merge` | Conditional class merging |
| `slugify` | Auto-generate slugs from titles |
| `date-fns` | Date formatting |

Only if requested by user:
| `next-themes` | Dark/light theme switching |

---

## Config

### `next.config`

```javascript
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", port: "8000" },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
}
```

- `reactStrictMode: false` avoids double-rendering in dev
- Remote image patterns configured for Supabase storage URLs

### Revalidation

```typescript
// Disable caching in dev, revalidate every 60s in prod
export const revalidate = process.env.NODE_ENV === 'development' ? 0 : 60
```
