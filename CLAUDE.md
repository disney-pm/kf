# Knowledge Fight Memorial Wall

A static fan memorial site for the Knowledge Fight podcast (which ended 2026-05-05 when Dan and Jordan reached an impasse). Visitors leave sticky-note tributes on a shared wall.

## About the human

**The user is not technical.** Notes for future Claude sessions:

- Explain things in plain language. Avoid unexplained jargon.
- Don't paste raw stack traces or assume the user can debug.
- When something needs setup (account creation, copying keys, etc.), give numbered steps with what to click, not just what to do.
- Tim won't let them forget they're non-technical, but Claude shouldn't make that worse.

## Repo layout

Three flat files, no build step, no framework:

- `index.html` — page structure, inline SVG cartoons, form, wall, modal
- `style.css` — all styling including the drifting-cartoons layer
- `main.js` — Supabase calls, sticky-note rendering, captcha, flyer engine

Open `index.html` in a browser. That's it.

## Persistence: Supabase

Notes are stored in a Supabase project so everyone sees everyone's notes.

### One-time setup (for the human)

1. Go to **supabase.com** → sign up (GitHub login works) → "New project". Pick any name, save the database password somewhere safe.
2. Wait ~2 minutes for the project to spin up.
3. In the left sidebar, click **SQL Editor** → "New query" → paste **everything** in the box below → click "Run".

   ```sql
   create table if not exists notes (
     id          uuid primary key default gen_random_uuid(),
     name        text,
     where_      text,
     body        text not null check (char_length(body) between 1 and 800),
     tone        text not null check (tone in ('hinged','unhinged')),
     created_at  timestamptz not null default now()
   );

   alter table notes enable row level security;

   create policy "anyone can read notes"
     on notes for select
     to anon
     using (true);

   create policy "anyone can insert notes"
     on notes for insert
     to anon
     with check (
       char_length(body) between 1 and 800
       and tone in ('hinged','unhinged')
       and (name is null or char_length(name) <= 40)
       and (where_ is null or char_length(where_) <= 40)
     );
   ```

4. In the left sidebar, click **Project Settings → API**. Copy two values:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)
5. Open `main.js` and paste them into the two clearly-marked constants near the top:

   ```js
   const SUPABASE_URL      = 'PASTE_PROJECT_URL_HERE';
   const SUPABASE_ANON_KEY = 'PASTE_ANON_KEY_HERE';
   ```

That's it. The site will start storing notes in Supabase. Until those two constants are filled in, the site falls back to local-only mode (notes only visible to whoever wrote them).

### Why the anon key in client code is OK

Supabase's anon key is designed to be public. The actual security is the **Row-Level Security policies** above — they say "anyone can read, anyone can insert valid notes, nobody can update or delete." A determined attacker can't wipe the wall via the API.

### Moderating

If something nasty shows up:

1. Log into Supabase.
2. Left sidebar → **Table Editor** → `notes` table.
3. Find the row, click the row's checkbox, click "Delete".

That's it. The wall updates next time someone refreshes.

## Bot protection

A hidden honeypot field on the form catches lazy bots (real users never fill it; bots that auto-fill every input do). There's also an optional "What's your bright spot, buddy?" prompt — purely sentimental, not validated. No third-party captcha service.

## Visual: drifting cartoons

The background layer continuously animates inline-SVG cartoons of Dan, JorDann, Celine, gay frogs, knives, Final Brain bottles, etc. The layer is hidden when the visitor's OS has "reduce motion" enabled.

## Branch

Development happens on `claude/knowledge-fight-memorial-wall-nF7Xo`.

---

# Claude Code operational notes (this repo)

## Git remote: always push via PAT, not the proxy

The `origin` remote points at the local git proxy (`http://local_proxy@127.0.0.1:.../git/disney-pm/kf`). Its GitHub App installation token is unreliable — pushes regularly 403 with `Permission to disney-pm/kf.git denied to disney-pm`, even right after the connector is re-added.

For any operation that touches the remote (push, fetch from origin if it fails, etc.), skip the proxy and use the personal PAT in `$GH_TOKEN` directly:

```sh
git push "https://disney-pm:${GH_TOKEN}@github.com/disney-pm/kf.git" HEAD:refs/heads/<branch>
```

`$GH_TOKEN` has admin/push on `disney-pm/kf` (verified). Don't loop on proxy 403s — go straight to the PAT. When logging the command, redact the token.

## PRs: also use the PAT, not the GitHub button or MCP tools

The web UI's "Compare & pull request" button fails for this repo, and `mcp__github__create_pull_request` returns `403 Resource not accessible by integration` (its app installation lacks `pull_requests: write`). Create PRs via the REST API with `$GH_TOKEN`:

```sh
curl -s -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/disney-pm/kf/pulls \
  -d '{"title":"...","head":"<branch>","base":"main","body":"..."}'
```

Same rule applies for any other write operation against `disney-pm/kf` (issues, comments, merges): if the MCP/proxy path 403s, fall back to `curl` + `$GH_TOKEN` directly. Always redact the token when logging.

## Proxy is read-only, not fully broken

`git fetch origin` works through the proxy — only writes 403. Don't bypass the proxy for fetches; just push/PR-create via the PAT.

## Sync the tracking ref after a PAT push

A direct push to `github.com` leaves `origin/<branch>` stale, which trips the stop-hook's "unpushed commits" check. After every PAT push, run:

```sh
git fetch origin <branch>
```

to update the local tracking ref.
