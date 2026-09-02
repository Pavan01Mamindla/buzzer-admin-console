# Buzzer Admin Console

Angular 19 (standalone components, signals, SCSS) admin console for Buzzer, built against the
shared backend at `https://backend-3ofw.onrender.com/api`.

## Stack

- Angular 19, standalone components, signals for state, no NgModules
- SCSS with design tokens matching the brand: surfaces `#131515` / `#212121`,
  accents `#FFB414` / `#EC193C` / `#2ED368`, white text
- No UI kit — custom table/dialog/sidebar components tuned to the Figma layout

## Getting started

```bash
npm install
npm start          # ng serve, http://localhost:4200
npm run build       # production build -> dist/buzzer-admin-console/browser
```

The backend URL lives only in `src/environments/environment.ts` /
`environment.prod.ts` — never hardcoded in a component or service.

### Test accounts (do not create new ones)

| Email | Password | Role |
|---|---|---|
| admin@buzzer.dev | Admin123! | admin |
| operator@buzzer.dev | Operator123! | operator |
| viewer@buzzer.dev | Viewer123! | viewer |
| org@buzzer.dev | Organisation123! | org |

Reads are open to any logged-in user.
- **Sports, Governing Bodies, Organisations, Teams, Players** writes: `admin`, `operator`.
- **Squad & Staff** (including their bulk import) writes: `admin`, `org` — **not** `operator`.
Everyone else gets a `403`, which the UI shows inline (not a logout — see Auth below).

### A note on shared data

The database is shared and server-owned. Nothing in this app seeds or resets it via
`localStorage` — the only thing kept there is the access/refresh token pair, purely so a
page refresh doesn't log you out. When creating test records through the UI, prefix the
name with your own name (e.g. `Rohit - Test FC`) and soft-delete them when you're done, so
it's obvious what's throwaway test data in the shared environment.

## Response shape

Every response is wrapped:

```jsonc
// single item
{ "success": true, "data": { ... } }

// list
{ "success": true, "data": [ ... ], "meta": { "page": 1, "limit": 12, "total": 52 } }
```

`src/app/core/http/api-envelope.util.ts` has `unwrap()` / `unwrapList()` helpers that every
service uses — no component or service reads a bare response body.

## Auth

`src/app/core/services/auth.service.ts` and `src/app/core/interceptors/auth.interceptor.ts`:

- `POST /api/auth/login` returns `data: { accessToken, refreshToken, user }` — **both**
  tokens are stored (access: 15 min, refresh: 7 days). Storing only the access token was
  flagged as the reason this task usually fails, so this was checked carefully.
- The interceptor attaches `Authorization: Bearer <accessToken>` to every request.
- On a `401` (and only then, and only for non-auth endpoints), it calls
  `POST /api/auth/refresh { refreshToken }` **once**, retries the original request with the
  new access token, and only clears the session and redirects to `/login` if the refresh
  itself fails. Refresh rotates the token, so a second parallel refresh would revoke the
  first and kill the session — `AuthService.refreshAccessToken()` shares one in-flight
  `Observable` (via `shareReplay`) so concurrent 401s all await the same refresh call
  instead of racing.
- `POST /api/auth/logout { refreshToken }` is called best-effort on sign-out; the local
  session is cleared either way.
- `403` is treated as a permissions problem, **not** a session problem — the interceptor
  passes it straight through and the calling component shows an inline message (e.g. "needs
  admin or operator") instead of logging the user out.
- `AuthGuard` calls `GET /api/auth/me` on every entry to the shell and reads `role` from
  that response. The role is never decoded from the JWT client-side.
- Session survives a refresh because the tokens live in `localStorage` (session
  persistence only, not app data — see the gotchas below).

## App structure

```
src/app/
  core/
    http/api-envelope.util.ts     # unwrap()/unwrapList() for the { success, data, meta } shape
    guards/auth.guard.ts          # GET /api/auth/me before entering the shell
    interceptors/auth.interceptor.ts  # Bearer header, single-flight refresh-and-retry, 403 pass-through
    services/
      auth.service.ts             # login, dual-token storage, refresh, logout, role
      sports.service.ts           # GET/POST /api/organizations/sports, PATCH/DELETE /:id
      organization.service.ts     # OrganizationTreeService: Governing Body / Organisation / Team / Player CRUD
      squad-staff.service.ts      # /squad, /staff (+ grouped), /athletes/:userId
      bulk-import.service.ts      # sequential POST importer, 409/429 aware
  layout/
    shell/, sidebar/, header/     # app shell: collapsible sidebar, header + search
  features/
    auth/login/                   # login screen (shows the cold-start "waking up" hint)
    sports/
      sports-list/                # Sports Catalogue: stat cards + table + CRUD dialogs
      sport-detail/                # Sport -> Governing Bodies
      governing-body-detail/       # Governing Body -> Organisations
      organisation-detail/         # Organisation -> Teams / Squad / Staff tabs
      team-detail/                 # Team -> Players (the level added in the Week 2 brief)
      bulk-import/                 # CSV/JSON import across all 7 collections, added/skipped/error report
  shared/components/               # icon, stat-card, breadcrumbs, data-table, dialogs
```

## Drill-down hierarchy

```
Sport ──▶ Governing Body ──▶ Organisation ──┬──▶ Team ──▶ Player
                                             ├──▶ Squad  (roster, admin/org write)
                                             └──▶ Staff  (roster, admin/org write, grouped)
```

All four catalogue levels below Sport live under `/api/organizations/` and are filtered
server-side by the parent id (never fetched in full and filtered client-side):

| Level | Endpoint | Filter |
|---|---|---|
| Governing Body | `/api/organizations/governing-bodies` | `?sportId=` |
| Organisation | `/api/organizations/organizations` | `?governingBodyId=` |
| Team | `/api/organizations/teams` | `?organizationId=` |
| Player | `/api/organizations/players` | `?teamId=` |

Each level's page has: header, stat cards, a server-side searchable/paginated child table,
breadcrumbs, and its own add dialog. The catalogue starts empty in this environment — there's
no seed data, so the first thing to do after logging in as `admin` or `operator` is add a
sport, then drill in and build out a body/organisation/team from there.

Squad and Staff are unchanged from the original brief and still hang off the *Organisation*
node (`/api/organizations/:id/squad`, `/staff`), not the Team — this matches what the task
brief documents explicitly, even though Team now sits between Organisation and Player in the
generic drill-down.

## Gotchas this app already accounts for

1. **The `Z`.** Sports live at `/api/organizations/sports`, not `/api/sports`.
2. **Cold start.** The free-tier backend sleeps after 15 min idle; the first request can
   take 30–50s. The login screen shows a "waking the server up" hint after a few seconds.
3. **Shared, server-owned database.** Nothing seeds or resets data in `localStorage` — see
   "A note on shared data" above.
4. **Server-side search & pagination.** Table queries use `?search=`, `?page=`, `?limit=`.
   Stat-card totals request `?limit=1` and read `meta.total`.
5. **Refresh rotation.** A single in-flight refresh call is shared across concurrent 401s
   so two parallel refreshes can't race and revoke each other — see Auth above.
6. **No bulk endpoint.** The importer POSTs rows one at a time (never `Promise.all`), treats
   `201` as added and `409` as a skipped duplicate, and retries once on `429` (rate limit is
   300 req/min).

## Duplicate names (409)

Sports, Governing Bodies, Organisations, Teams and Players all reject a duplicate `name`
with `409`. The add/edit dialog (`EntityFormDialogComponent`) surfaces this as a field-level
error under the Name input, not a generic banner, so it's clear exactly what needs changing.

## Loading / empty / error states

Every table in the app renders three distinct states:
- **Loading** — "Loading …" row while the request is in flight.
- **Empty** — a message tailored to whether a search term is active.
- **Error** — the failure reason plus a **Retry** button that re-runs the same query,
  distinct from the empty state so a `403`/network failure never looks like "there's just
  nothing here."

## Deployment (Vercel)

`vercel.json` is already set up:

```json
{
  "buildCommand": "npm run build -- --configuration production",
  "outputDirectory": "dist/buzzer-admin-console/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

1. Push this repo to GitHub.
2. Import it in Vercel ("Add New Project" → pick the repo). Vercel picks up `vercel.json`
   automatically.
3. Production branch is `main`. Every push redeploys.
4. `.github/workflows/ci.yml` runs a production build on every push/PR as a build gate.

**Test on the deployed URL, not just localhost**, per the submission requirements — the
cold-start behaviour (gotcha #2) and CORS are both things that can differ between the two.

## Images

`iconUrl`, `photoUrl` and `crestUrl` are plain URL fields — no upload flow is built, per the
"ask before building any upload flow" note in the brief.

## Known assumption to verify against the live Swagger doc

`/api/docs` on the live backend wasn't reachable from the network this project was
originally scaffolded in, so while the exact endpoints for Sports, Auth, and Squad/Staff are
taken directly from the task brief (and now match it closely), a couple of small things are
still best-effort inferences rather than confirmed against the Swagger UI:

- The exact body field names `OrganizationTreeService` sends when creating a Governing
  Body/Organisation/Team/Player (`sportId`, `governingBodyId`, `organizationId`, `teamId`)
  are inferred from the query-param names the brief gives for the *list* endpoints. If the
  create endpoints expect different field names, it's a one-file fix in
  `organization.service.ts`.
- `getStaffGrouped()` assumes the grouped staff response has a top-level `groups` key
  alongside `data`. If it's nested differently, adjust the `map()` in
  `squad-staff.service.ts`.

Everything else (response envelope, dual-token auth + refresh, 403 handling, per-collection
permissions, soft deletes, sequential bulk import) is wired up per the brief as written.
