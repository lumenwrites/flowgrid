# Website Starter Template

What's included in `website/` and how the pieces fit together.

For detailed patterns and conventions (API layer, forms, auth, Supabase, etc.), see `nextjs-patterns.md` — those are added per-project as needed.

## Tech Stack

Next.js 16 + React 19 + Tailwind v4. Dev server on port 3030.

Key dependencies (all pre-installed):
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Styling**: `tailwindcss`, `tailwind-merge`, `clsx`, `class-variance-authority`, `tailwindcss-animate`, `tw-colors`
- **Icons**: `@fortawesome/react-fontawesome` + solid/regular icon packs
- **Utilities**: `date-fns`

## Directory Structure

```
website/src/
  app/
    layout.tsx              Root layout (fonts, FontAwesome, html/body shell)
    error.tsx               Global error boundary (client component)
    (main-layout)/
      layout.tsx            Wraps pages with Header + Footer
      page.tsx              Home page (sample posts)
  components/
    Layout/
      Header.tsx            Top nav bar with logo + nav links
      Footer.tsx            Site footer
      Container.tsx         Centered content wrapper (max-w-md/lg, responsive padding)
    Posts/
      PostBox.tsx           Card component (title, description, tags)
      PostFooter.tsx        Tag row for PostBox
    PageError.tsx           Inline error display for server pages
  lib/
    utils.ts                cn(), getErrorMessage(), formatDate()
  types/
    index.ts                Shared TypeScript types (empty, ready to fill)
  styles/
    globals.css             Tailwind + theme tokens (@theme inline)
    fonts/Georgia/          Local Georgia font files (4 variants)
website/public/
  img/logo.png              Placeholder logo
  img/background-tile.webp  Tiled parchment background
  favicon.ico
```

## Layout System

Two-tier layout:

1. **Root layout** (`app/layout.tsx`) — loads fonts (Inter, Roboto Slab, Georgia), configures FontAwesome, sets up `<html>` and `<body>`. This is where you'd add global providers (auth context, toaster, etc).

2. **Main layout** (`app/(main-layout)/layout.tsx`) — wraps pages with `<Header />` and `<Footer />`. Pages that need a different shell (e.g. full-screen auth pages) go in a separate route group outside `(main-layout)`.

## Theming

Tailwind v4 with `@theme inline` in `globals.css`. No `tailwind.config.ts` — all tokens live in CSS:

- Three font families: `font-sans` (Inter), `font-serif` (Roboto Slab), `font-georgia` (Georgia)
- Warm palette: parchment `background`, cream `page`, brown text, orange CTA
- Tiled background image on body

To retheme: edit the CSS custom properties in `globals.css` and swap `public/img/background-tile.webp`.

## Error Handling

Two mechanisms:

- **`error.tsx`** — catches unhandled errors anywhere in the app. Shows the error message and a "Try again" button that calls Next.js's `reset()`. Use this as the last resort.

- **`<PageError />`** — for expected errors in server pages (not found, invalid input). Renders inline within the page layout instead of replacing everything. Logs to console in dev. Usage:

```tsx
try {
  const post = await getPost(slug)
} catch (err) {
  return <PageError title="Post not found" message="This post doesn't exist." error={err} />
}
```

## Utilities

`src/lib/utils.ts` provides:

- `cn(...classes)` — merges Tailwind classes (clsx + tailwind-merge)
- `getErrorMessage(err, fallback)` — safely extracts error message string
- `formatDate(isoString, pattern?)` — formats ISO date strings via date-fns (defaults to "MMM d, yyyy")

## What's Not Included (add per-project)

- **Backend** — Supabase, database, auth, API layer (see `nextjs-patterns.md` and `sql-schemas.md` for conventions when you need these)
- **Toast system** — useToast hook + Toaster component
- **Custom hooks** — `src/hooks/` directory (useDebounce, etc.)

## Starting a New Project

1. Copy this entire template folder to a new directory
2. Fill in `SPEC.md` with your project idea
3. Update `website/package.json` name
4. Update metadata in `website/src/app/layout.tsx` (title, description)
5. Update "ProjectTitle" in `Header.tsx` and `Footer.tsx`
6. Replace `public/img/logo.png` with your logo
7. Edit theme tokens in `globals.css` (or keep the warm aesthetic)
8. Replace the sample page content in `(main-layout)/page.tsx`
9. Add backend/database when needed (see references/)
