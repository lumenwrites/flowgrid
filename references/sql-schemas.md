# Supabase SQL Schema Standards

How to structure a Supabase Postgres database for a CRUD application. All examples use a generic blogging/community platform, but the patterns apply to any domain.

---

## Table of Contents

- [File Organization](#file-organization)
- [Schema Setup](#schema-setup)
- [Table Conventions](#table-conventions)
- [Row Level Security (RLS) Philosophy](#row-level-security-rls-philosophy)
- [Common Helpers](#common-helpers)
- [RPC Functions (the Core Pattern)](#rpc-functions-the-core-pattern)
- [CRUD Patterns](#crud-patterns)
- [Authorization Helpers](#authorization-helpers)
- [Query Patterns](#query-patterns)
- [Toggle / Vote Patterns](#toggle--vote-patterns)
- [Denormalized Counts with Triggers](#denormalized-counts-with-triggers)
- [Soft Deletes](#soft-deletes)
- [Slug Validation and Availability](#slug-validation-and-availability)
- [Many-to-Many Relationships (Tags)](#many-to-many-relationships-tags)
- [JSONB Aggregation in Queries](#jsonb-aggregation-in-queries)
- [Search with Trigram Indexes](#search-with-trigram-indexes)
- [Sorting Strategies](#sorting-strategies)
- [Auto-Profile Creation on Signup](#auto-profile-creation-on-signup)
- [Account Deletion](#account-deletion)
- [Storage Bucket Policies](#storage-bucket-policies)
- [Grants](#grants)
- [Constraints](#constraints)
- [Indexes](#indexes)
- [Bidirectional Relationships (Follows/Friends)](#bidirectional-relationships-followsfriends)

---

## File Organization

SQL init scripts use a **numbered-prefix naming convention** for deterministic execution order:

```
000_create_schemas.sql       -- Schema + extensions
005_common_helpers.sql       -- Shared utility functions
010_profiles_tables.sql      -- User profiles table
011_profiles_rpcs.sql        -- Profile-related RPCs + triggers
012_profiles_storage.sql     -- Avatar storage bucket + policies
020_posts_tables.sql         -- Posts, tags, post_authors tables
021_posts_rpcs.sql           -- Post CRUD RPCs
022_posts_storage.sql        -- Post image storage
060_likes_tables.sql         -- Likes + collections tables
061_likes_rpcs.sql           -- Like/collection RPCs
063_likes_triggers.sql       -- Denormalized count triggers
100_comments_tables.sql      -- Comments + comment_votes tables
101_comments_rpcs.sql        -- Comment CRUD RPCs
103_comments_triggers.sql    -- Comment vote count triggers
```

### Naming pattern: `{number}_{domain}_{type}.sql`

- **Number**: 3-digit prefix (000, 005, 010...) controls execution order. Use gaps (010, 020, 030) so you can insert files between existing ones later.
- **Domain**: feature area — `profiles`, `posts`, `comments`, `likes`, etc.
- **Type**: what the file contains — `tables`, `rpcs`, `storage`, or `triggers`.

### Within each domain, the file types are:

| Suffix     | Contains                                             |
|------------|------------------------------------------------------|
| `tables`   | CREATE TABLE, ALTER TABLE, ENABLE RLS, indexes, grants, RLS policies |
| `rpcs`     | CREATE OR REPLACE FUNCTION, GRANT EXECUTE, helper functions for auth checks |
| `storage`  | Storage bucket creation, storage object policies     |
| `triggers` | Trigger functions + CREATE TRIGGER statements        |

Tables files must come before RPCs that reference them. Triggers come after both since they reference both tables and sometimes RPCs.

### One important rule:

**Never create migration files.** Edit the existing init scripts in place. Don't write `migrate:up` / `migrate:down` sections.

---

## Schema Setup

Create a dedicated schema for your app. Don't put tables in `public`.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for fuzzy text search

CREATE SCHEMA myapp;

GRANT USAGE ON SCHEMA myapp TO anon, authenticated, service_role;
```

`pg_trgm` enables trigram indexes, which make `ILIKE '%term%'` queries fast.

All tables, functions, and triggers live inside your app schema (e.g. `myapp.posts`, `myapp.get_posts()`).

---

## Column naming

- Foreign keys: `{entity}_id` (e.g. `post_id`, `author_id`, `parent_id`)
- Counts: `{thing}_count` (e.g. `likes_count`, `comments_count`)
- Booleans: `is_{thing}` or plain adjective (e.g. `is_admin`, `draft`, `featured`, `deleted`)

---

## Row Level Security (RLS) Philosophy

**Enable RLS on every table**, but keep policies minimal. The heavy lifting happens in SECURITY DEFINER RPCs, not in RLS policies.

```sql
ALTER TABLE myapp.posts ENABLE ROW LEVEL SECURITY;
```

### When to use RLS policies

Use RLS only for **trivially simple, read-heavy operations** where an RPC would be overkill:

```sql
-- Anyone can read published posts (no auth required, simple filter)
CREATE POLICY "Anyone can read published posts" ON myapp.posts
FOR SELECT USING (draft = false);

-- Anyone can read profiles (nothing secret)
CREATE POLICY "Anyone can read profiles" ON myapp.profiles
FOR SELECT USING (true);

-- Users can update their own profile (simple ownership check)
CREATE POLICY "Users can update their own profile" ON myapp.profiles
FOR UPDATE USING (id = auth.uid());
```

### When NOT to use RLS

For anything involving:
- Complex authorization logic (ownership through join tables, role checks)
- Business logic during writes (validation, slug checks, side effects)
- Aggregation or computed fields in reads

Use a SECURITY DEFINER RPC instead. This keeps all your business logic in one place (the RPC function) rather than scattered between RLS policies and client code.

### Policy naming

Use descriptive English sentences:

```sql
DROP POLICY IF EXISTS "Anyone can read published posts" ON myapp.posts;
CREATE POLICY "Anyone can read published posts" ON myapp.posts
FOR SELECT USING (draft = false);
```

Always `DROP POLICY IF EXISTS` before `CREATE POLICY` so scripts are idempotent.

---

## Common Helpers

Define reusable utility functions in a shared helpers file. These are used throughout your RPCs.

### `require_auth()`

The most-used helper. Call it at the top of any RPC that requires a logged-in user:

```sql
CREATE OR REPLACE FUNCTION myapp.require_auth()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
END;
$$;
```

### `require_admin()`

For admin-only operations:

```sql
CREATE OR REPLACE FUNCTION myapp.require_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM myapp.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
END;
$$;
```

### `validate_slug()`

Reusable slug validation with configurable field name for error messages:

```sql
CREATE OR REPLACE FUNCTION myapp.validate_slug(
  p_slug TEXT,
  p_max_length INT DEFAULT 50,
  p_field_name TEXT DEFAULT 'Slug'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_slug IS NULL OR trim(p_slug) = '' THEN
    RAISE EXCEPTION '% cannot be empty', p_field_name;
  END IF;

  IF length(p_slug) > p_max_length THEN
    RAISE EXCEPTION '% is too long (max % characters)', p_field_name, p_max_length;
  END IF;

  IF p_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION '% must contain only lowercase letters, numbers, and hyphens', p_field_name;
  END IF;
END;
$$;
```

---

## RPC Functions (the Core Pattern)

**All database operations go through SECURITY DEFINER RPC functions.** This is the central design principle.

### Why SECURITY DEFINER RPCs?

- **Centralized authorization**: auth checks live in one place, not scattered across RLS policies
- **Business logic in SQL**: validation, side effects, and complex queries in a single transaction
- **Clean API surface**: the frontend calls named functions with typed parameters
- **No direct table access needed**: the function runs with elevated privileges, so RLS doesn't need to allow the operation

### Anatomy of an RPC

```sql
CREATE OR REPLACE FUNCTION myapp.post_create(
  p_title TEXT,
  p_slug TEXT,
  p_content TEXT,
  p_draft BOOLEAN,
  p_tag_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  -- 1. Auth check
  PERFORM myapp.require_auth();

  -- 2. Validate input
  PERFORM myapp.validate_slug(p_slug, 100, 'Post slug');

  -- 3. Business logic checks
  IF NOT myapp.is_slug_available(p_slug) THEN
    RAISE EXCEPTION 'A post with this URL already exists.';
  END IF;

  -- 4. Core operation
  INSERT INTO myapp.posts (title, slug, content, draft)
  VALUES (p_title, p_slug, p_content, p_draft)
  RETURNING id INTO v_new_id;

  -- 5. Related operations / side effects
  INSERT INTO myapp.post_authors (post_id, user_id)
  VALUES (v_new_id, auth.uid());

  INSERT INTO myapp.post_tags (post_id, tag_id)
  SELECT v_new_id, t.id
  FROM unnest(p_tag_ids) AS t(id)
  WHERE EXISTS (SELECT 1 FROM myapp.tags WHERE id = t.id);

  -- 6. Return result
  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION myapp.post_create(TEXT, TEXT, TEXT, BOOLEAN, UUID[]) TO authenticated;
```

### Naming conventions

| Pattern | Used for | Examples |
|---------|----------|---------|
| `{entity}_create` | Create operations | `post_create`, `comment_create`, `collection_create` |
| `{entity}_update` | Update operations | `post_update`, `comment_update` |
| `{entity}_delete` | Delete operations | `post_delete`, `comment_delete` |

### Parameter naming

- **Parameters**: prefix with `p_` — `p_post_id`, `p_title`, `p_slug`
- **Local variables**: prefix with `v_` — `v_new_id`, `v_exists`, `v_count`


---

## CRUD Patterns

### Create

```sql
CREATE OR REPLACE FUNCTION myapp.post_create(
  p_title TEXT,
  p_slug TEXT,
  p_content TEXT,
  p_draft BOOLEAN,
  p_tag_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id UUID;
  v_is_available BOOLEAN;
BEGIN
  PERFORM myapp.require_auth();
  PERFORM myapp.validate_slug(p_slug, 100, 'Post slug');

  SELECT myapp.is_slug_available(p_slug) INTO v_is_available;
  IF NOT v_is_available THEN
    RAISE EXCEPTION 'A post with this URL already exists.';
  END IF;

  INSERT INTO myapp.posts (title, slug, content, draft)
  VALUES (p_title, p_slug, p_content, p_draft)
  RETURNING id INTO v_new_id;

  -- Set current user as author
  INSERT INTO myapp.post_authors (post_id, user_id)
  VALUES (v_new_id, auth.uid());

  -- Associate tags (only valid ones)
  INSERT INTO myapp.post_tags (post_id, tag_id)
  SELECT v_new_id, t.id
  FROM unnest(p_tag_ids) AS t(id)
  WHERE EXISTS (SELECT 1 FROM myapp.tags WHERE id = t.id);

  -- Auto-like own post
  INSERT INTO myapp.likes (post_id, user_id)
  VALUES (v_new_id, auth.uid());

  RETURN v_new_id;
END;
$$;
```

Key points:
- Validate auth, then input, then business rules
- `RETURNING id INTO v_new_id` captures the new ID
- Handle related records (authors, tags) in the same transaction
- Auto-actions (like auto-liking your own post) happen as side effects

### Update

```sql
CREATE OR REPLACE FUNCTION myapp.post_update(
  p_post_id UUID,
  p_title TEXT,
  p_slug TEXT,
  p_content TEXT,
  p_draft BOOLEAN,
  p_tag_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_available BOOLEAN;
BEGIN
  PERFORM myapp.require_auth();
  PERFORM myapp.require_post_author(p_post_id);
  PERFORM myapp.validate_slug(p_slug, 100, 'Post slug');

  -- Check slug availability excluding the current record
  SELECT myapp.is_slug_available(p_slug, p_post_id) INTO v_is_available;
  IF NOT v_is_available THEN
    RAISE EXCEPTION 'A post with this URL already exists.';
  END IF;

  UPDATE myapp.posts
  SET title = p_title, slug = p_slug, content = p_content, draft = p_draft
  WHERE id = p_post_id;

  -- Replace tags: delete all, then re-insert
  DELETE FROM myapp.post_tags WHERE post_id = p_post_id;
  INSERT INTO myapp.post_tags (post_id, tag_id)
  SELECT p_post_id, t.id
  FROM unnest(p_tag_ids) AS t(id)
  WHERE EXISTS (SELECT 1 FROM myapp.tags WHERE id = t.id);
END;
$$;
```

Key points:
- `require_post_author()` checks ownership before allowing the update
- Slug availability check passes the current ID to exclude self
- Many-to-many relationships (tags) are replaced by delete-all then re-insert

### Delete

```sql
CREATE OR REPLACE FUNCTION myapp.post_delete(p_post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM myapp.require_auth();
  PERFORM myapp.require_post_author(p_post_id);

  DELETE FROM myapp.posts WHERE id = p_post_id;
END;
$$;
```

`ON DELETE CASCADE` on child tables handles cleanup automatically.

## Authorization Helpers

For entities where ownership is checked through a join table (not a simple `user_id` column), create a pair of helper functions:

### Check function (returns boolean)

```sql
CREATE OR REPLACE FUNCTION myapp.is_post_author(
  p_post_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM myapp.post_authors
    WHERE post_id = p_post_id AND user_id = p_user_id
  );
END;
$$;
```

The optional `p_user_id` parameter defaults to the current user but can be overridden (useful for admin operations or checking another user's permissions).

### Require function (raises exception)

```sql
CREATE OR REPLACE FUNCTION myapp.require_post_author(p_post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT myapp.is_post_author(p_post_id) THEN
    RAISE EXCEPTION 'Post not found or you do not have permission to edit it';
  END IF;
END;
$$;
```

Note: the error message deliberately doesn't distinguish "not found" from "no permission" — this prevents information leakage about which records exist.

### Usage in RPCs

```sql
BEGIN
  PERFORM myapp.require_auth();
  PERFORM myapp.require_post_author(p_post_id);
  -- ... proceed with operation
END;
```

---

## Query Patterns

### Listing records — `RETURNS TABLE`

For listing endpoints, return a `TABLE` with all needed columns explicitly defined. This gives the frontend a predictable, typed shape:

```sql
CREATE OR REPLACE FUNCTION myapp.get_posts(
  p_sort_by TEXT DEFAULT 'hot',
  p_search_text TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  content TEXT,
  likes_count INT,
  draft BOOLEAN,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  tags JSONB,
  authors JSONB,
  is_liked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.slug,
    p.content,
    p.likes_count,
    p.draft,
    p.featured,
    p.created_at,
    -- Aggregate tags as JSON array
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object('id', t.id, 'title', t.title, 'slug', t.slug)
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'::jsonb
    ) AS tags,
    -- Get authors via helper function
    myapp.get_authors_json(p.id) AS authors,
    -- Per-user state: has current user liked this?
    EXISTS (
      SELECT 1 FROM myapp.likes l
      WHERE l.post_id = p.id AND l.user_id = auth.uid()
    ) AS is_liked
  FROM myapp.posts p
  LEFT JOIN myapp.post_tags pt ON p.id = pt.post_id
  LEFT JOIN myapp.tags t ON pt.tag_id = t.id
  WHERE
    p_search_text IS NULL OR (
      p.title ILIKE '%' || p_search_text || '%' OR
      p.content ILIKE '%' || p_search_text || '%'
    )
  GROUP BY p.id
  ORDER BY ...;
END;
$$;
```

### Single record detail — `RETURNS JSONB`

For detail pages, return a single JSONB object. This is convenient because you can include nested objects and computed fields:

```sql
CREATE OR REPLACE FUNCTION myapp.get_post(p_post_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'slug', p.slug,
      'content', p.content,
      'created_at', p.created_at,
      'likes_count', p.likes_count,
      'tags', COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object('id', t.id, 'title', t.title, 'slug', t.slug)),
        '[]'::jsonb
      ),
      'authors', myapp.get_authors_json(p.id),
      'is_liked', EXISTS (
        SELECT 1 FROM myapp.likes l WHERE l.post_id = p.id AND l.user_id = auth.uid()
      ),
      'is_author', EXISTS (
        SELECT 1 FROM myapp.post_authors pa WHERE pa.post_id = p.id AND pa.user_id = auth.uid()
      )
    )
    FROM myapp.posts p
    LEFT JOIN myapp.post_tags pt ON p.id = pt.post_id
    LEFT JOIN myapp.tags t ON pt.tag_id = t.id
    WHERE p.slug = p_post_slug
    GROUP BY p.id
  );
END;
$$;
```


## Search with Trigram Indexes

### Create the index

```sql
CREATE INDEX idx_posts_title_trgm
  ON myapp.posts USING gist (title gist_trgm_ops(siglen=32));

CREATE INDEX idx_posts_content_trgm
  ON myapp.posts USING gist (content gist_trgm_ops(siglen=32));

CREATE INDEX idx_profiles_username_trgm
  ON myapp.profiles USING gist (username gist_trgm_ops(siglen=32));
```

This requires the `pg_trgm` extension (created in the schema setup file).

### Use in queries

```sql
WHERE
  p_search_text IS NULL OR (
    p.title ILIKE '%' || p_search_text || '%' OR
    p.content ILIKE '%' || p_search_text || '%'
  )
```

The `p_search_text IS NULL` short-circuit means the search filter is only applied when a search term is provided. When NULL, all records are returned.

### Search with relevance sorting

Put exact matches first:

```sql
ORDER BY
  CASE WHEN p.username ILIKE p_search_term THEN 0 ELSE 1 END,
  p.username
LIMIT p_limit_count;
```

---

## Auto-Profile Creation on Signup

When a user signs up via Supabase Auth, automatically create their profile with a trigger on `auth.users`:

```sql
CREATE OR REPLACE FUNCTION myapp.create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username TEXT;
  v_suffix INT := 1;
  v_base_username TEXT;
BEGIN
  v_username := NEW.raw_user_meta_data->>'username';

  IF v_username IS NULL THEN
    v_username := 'user_' || NEW.id;
  END IF;

  v_base_username := v_username;
  -- Handle username conflicts by appending _1, _2, etc.
  WHILE EXISTS (SELECT 1 FROM myapp.profiles WHERE username = v_username) LOOP
    v_username := v_base_username || '_' || v_suffix;
    v_suffix := v_suffix + 1;
  END LOOP;

  INSERT INTO myapp.profiles (id, username)
  VALUES (NEW.id, v_username);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_user_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION myapp.create_user_profile();
```

Key points:
- The username comes from `raw_user_meta_data` (set during signup from the frontend form)
- Conflict handling with a WHILE loop ensures uniqueness
- The trigger runs AFTER INSERT on `auth.users` — the user already exists, so we're just creating the matching profile row

---

## Account Deletion

A dedicated RPC that cleans up everything in the right order:

```sql
CREATE OR REPLACE FUNCTION myapp.delete_user()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_post_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Handle posts where user is an author
  FOR v_post_id IN
    SELECT post_id FROM myapp.post_authors WHERE user_id = v_user_id
  LOOP
    IF (SELECT COUNT(*) FROM myapp.post_authors WHERE post_id = v_post_id) = 1 THEN
      -- User is sole author: delete the post (and its tags, likes, etc. via CASCADE)
      DELETE FROM myapp.post_tags WHERE post_id = v_post_id;
      DELETE FROM myapp.posts WHERE id = v_post_id;
    ELSE
      -- Post has other authors: just remove this user as co-author
      DELETE FROM myapp.post_authors WHERE post_id = v_post_id AND user_id = v_user_id;
    END IF;
  END LOOP;

  DELETE FROM myapp.profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION myapp.delete_user() TO authenticated;
```

The logic here handles co-authored content: if the user is the only author, delete the post. If there are co-authors, just remove the user from the author list.

---

## Storage Bucket Policies

### Create a bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO NOTHING;
```

`public: true` means files can be read without auth. The policies below further control who can write.

### Public read, user-scoped write

The standard pattern: anyone can read, but users can only upload/modify files in their own folder (folder name = their user ID):

```sql
-- Public read
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-files');

-- User-scoped write
DROP POLICY IF EXISTS "Users can manage their own files" ON storage.objects;
CREATE POLICY "Users can manage their own files" ON storage.objects
FOR ALL USING (
  auth.role() = 'authenticated'
  AND bucket_id = 'user-files'
  AND (myapp.foldername(name))[1] = auth.uid()::text
);
```

The `foldername()` helper extracts the first folder segment from the path. Upload paths should follow the convention: `{user_id}/{filename}`.

---

## Grants

### Schema grant

```sql
GRANT USAGE ON SCHEMA myapp TO anon, authenticated, service_role;
```

### Table grants

Grant only what's needed. If all reads go through RPCs, you may not need SELECT grants at all — but if you have RLS policies for direct reads, you do:

```sql
-- Tables with RLS SELECT policies (direct reads allowed)
GRANT SELECT ON myapp.profiles TO anon, authenticated;
GRANT UPDATE ON myapp.profiles TO authenticated;  -- for direct profile updates via RLS

GRANT SELECT ON myapp.posts TO anon, authenticated;  -- for RLS-based reads

-- Tables only accessed through RPCs: no grants needed on the table itself
-- (the SECURITY DEFINER function has access regardless)
```

### Function grants

Every RPC needs an explicit EXECUTE grant. Choose the audience:

```sql
-- Public data (anyone, even logged-out users)
GRANT EXECUTE ON FUNCTION myapp.get_posts(TEXT, TEXT) TO anon, authenticated, service_role;

-- Authenticated-only operations
GRANT EXECUTE ON FUNCTION myapp.post_create(...) TO authenticated;

-- Admin/service operations
GRANT EXECUTE ON FUNCTION myapp.create_test_user(...) TO service_role;
```

Common patterns:
- **Read operations** (`get_*`): grant to `anon, authenticated, service_role`
- **Write operations** (`*_create`, `*_update`, `*_delete`, `toggle_*`): grant to `authenticated`
- **Admin operations**: grant to `authenticated` (the function itself checks `require_admin()`)
- **Service-only operations** (seed data, test utilities): grant to `service_role`

---


## Indexes

### Standard single-column

For columns used in WHERE clauses and JOINs:

```sql
CREATE INDEX idx_comments_post_id ON myapp.comments(post_id);
CREATE INDEX idx_collections_user_id ON myapp.collections(user_id);
CREATE INDEX idx_posts_slug ON myapp.posts(slug);
```

### Trigram indexes (for ILIKE search)

```sql
CREATE INDEX idx_posts_title_trgm
  ON myapp.posts USING gist (title gist_trgm_ops(siglen=32));
```

### Index naming convention

`idx_{table}_{column}` or `idx_{table}_{column}_trgm` for trigram indexes.

---

## Test User Creation

For seeding test data, create a service-role-only utility function:

```sql
CREATE OR REPLACE FUNCTION myapp.create_test_user(
  p_email TEXT,
  p_password TEXT,
  p_username TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token,
    email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(), 'authenticated', 'authenticated',
    p_email, crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('username', COALESCE(p_username, 'user_' || substr(md5(random()::text), 0, 10))),
    now(), now(), '', '', '', ''
  ) RETURNING id INTO v_new_user_id;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_new_user_id, v_new_user_id,
    jsonb_build_object('sub', v_new_user_id::text, 'email', p_email),
    'email', p_email, now(), now(), now()
  );

  RETURN v_new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION myapp.create_test_user(TEXT, TEXT, TEXT) TO service_role;
```

Grant this only to `service_role` — it should never be callable from the frontend.
