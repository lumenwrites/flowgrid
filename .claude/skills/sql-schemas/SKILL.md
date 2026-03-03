---
name: sql-schemas
description: Use this whenever we talk about or write SQL.
---

# SQL Schemas

Read `references/sql-schemas.md` for the full standards and patterns reference.

Follow those conventions for all SQL work: file organization, naming, RPC structure, table design, triggers, RLS, etc.

## Keeping things in sync

After any SQL change, update all three of:

1. **The SQL init scripts** — edit in place, don't create new migration files.
2. **`website/src/api/`** — the TypeScript RPC wrappers must mirror the SQL. Adding a function means adding it (with typed Input/Output types) to the relevant file in `website/src/api/`. Removing a function means finding and deleting its wrapper and any call sites.
3. **Removed code** — when deleting a function or table, grep for all usages in both SQL and TypeScript and clean them up completely.
