# XLEVELSUP

npm-workspaces monorepo holding two independently deployed Next.js 16 apps.

| Workspace    | Package      | Domain                  | Dev port | What it is                                  |
| ------------ | ------------ | ----------------------- | -------- | ------------------------------------------- |
| `apps/web`   | `@xlu/web`   | `www.xlevelsup.com`     | 3000     | Public marketing site                       |
| `apps/admin` | `@xlu/admin` | `admin.xlevelsup.com`   | 3001     | ERP (`/erp/*`) + employee portal (`/employee/*`) |

## Getting started

```bash
npm install            # one install at the root covers both workspaces

npm run dev            # marketing site  → http://localhost:3000
npm run dev:admin      # ERP + portal    → http://localhost:3001
```

Run both in separate terminals. `apps/web` calls `apps/admin` for team data, so
start admin too if you are working on `/team`.

Each workspace needs its own `.env.local` — copy from its `env.example`:

```bash
cp apps/web/env.example   apps/web/.env.local
cp apps/admin/env.example apps/admin/.env.local
```

## Scripts

Root scripts fan out to the workspaces; anything can also be run directly with
`-w @xlu/web` / `-w @xlu/admin`.

| Command                 | Effect                                  |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | marketing dev server (port 3000)        |
| `npm run dev:admin`     | admin dev server (port 3001)            |
| `npm run build`         | production build of both apps           |
| `npm run build:web`     | production build of the marketing app   |
| `npm run build:admin`   | production build of the admin app       |
| `npm run lint`          | lint both apps                          |
| `npm run typecheck`     | `tsc --noEmit` on both apps             |

ERP operational scripts live in `apps/admin` and run from there:

```bash
npm run init-leave-balances -w @xlu/admin
```

## How the two apps relate

They share no code — no `packages/` directory, no transpiled workspace
dependency. Each is a self-contained Next.js app with its own `package.json`,
`tsconfig.json`, `next.config.ts` and `node_modules` resolution. That is
deliberate: the two have diverging design systems and very different threat
models, and a shared UI package would couple them for the sake of a handful of
small components.

There is exactly **one runtime dependency between them**, in one direction:

```
apps/web  GET /team
    └── fetch  https://admin.xlevelsup.com/api/public/team   (ISR, 5 min)
            └── apps/admin  service-role → Supabase `employees`
```

The marketing site holds **no database credentials at all**. Before the split,
`/team` imported the ERP data layer directly, which meant
`SUPABASE_SERVICE_ROLE_KEY` had to be present in the public-facing deployment.
Routing it through admin confines that key to the internal app.

If admin is unreachable, `apps/web/lib/team.ts` logs and returns `[]`, so `/team`
degrades to its static copy rather than 500-ing.

The response shape is a contract between
`apps/admin/app/api/public/team/route.ts` and `apps/web/lib/team.ts`. Both
declare a matching `TeamMember` — change them together.

Marketing → admin **links** (the footer's Employee/Admin Login) are plain
anchors built by `apps/web/lib/admin-url.ts`, not `next/link`; a client-side
navigation to another origin would 404.

## Deployment

Two separate projects off the same repository.

| Setting          | Marketing           | Admin                  |
| ---------------- | ------------------- | ---------------------- |
| Root directory   | `apps/web`          | `apps/admin`           |
| Build command    | `npm run build`     | `npm run build`        |
| Install command  | `npm install`       | `npm install`          |
| Domain           | `www.xlevelsup.com` | `admin.xlevelsup.com`  |

On Vercel, set the root directory per project and leave "Include files outside
the root directory" enabled so the root lockfile and `tsconfig.base.json`
resolve.

Env vars per project are exactly what each `env.example` lists. The marketing
project must **not** be given `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET`.

`apps/admin` sends `X-Robots-Tag: noindex, nofollow` on every response and sets
`robots: { index: false }` in its root layout. Only `apps/web` publishes a
`sitemap.xml` and `robots.txt`.

## Layout

```
apps/
  web/                  @xlu/web — marketing
    app/                routes, root layout, globals.css, sitemap, robots
    components/         sections, marketing, solutions, team, layout, ui
    actions/            lead capture (Google Sheets)
    lib/                google-sheets, team (admin API client), admin-url
    config/             solutions.config
    public/             logos, favicons, client assets
  admin/                @xlu/admin — ERP + employee portal
    app/                erp/*, employee/*, api/erp/*, api/public/team
    components/         erp, employee, ui
    actions/erp/        server actions
    lib/                auth, supabase, billing-tax, erp/*, utils
    config/             store.config (invoice identity)
    types/              erp, billing, finance, ui prop types
    db/                 schema + SQL migrations
    scripts/            operational scripts (tsx)
    data/               legacy SQLite file, superseded by Supabase
docs/                   ERP feature and policy docs
tsconfig.base.json      compiler options both apps extend
```

## Notes

- `db/` and `scripts/` sit under `apps/admin` because they are entirely
  ERP-owned. Nothing in `apps/web` touches a database.
- `better-sqlite3` is legacy: only `apps/admin/db/init.ts` uses it. Supabase is
  the live datastore.
- `apps/admin/app/globals.css` is the shared stylesheet minus the `--xlu-*`
  tokens and `.xlu-*` primitives, which had zero references in ERP code.
- `Button` and `Modal` exist in both apps as intentional forks. The marketing
  copies are on the legacy `--cyan`/`--purple` tokens and are being replaced by
  `components/marketing/XluButton.tsx`; the ERP copies stay as they are.
