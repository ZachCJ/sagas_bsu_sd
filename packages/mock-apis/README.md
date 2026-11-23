# packages/mock-apis

Stand-ins for the content layer's API and the intelligence layer's API, so the reading site can
work before either layer releases its API, and keep working if one of them is down.

Each mock is a plain function from a web `Request` to a `Response`. The same code runs inside a
Next.js route handler, on Cloudflare Workers, and on its own with Node.

## What's in it

**The content layer's API** (`@sagas/mock-apis/capture`), on the routes upstream already names:

| Route | What it does |
| --- | --- |
| `POST /records` | Takes a record without an id, gives it a UUID, answers 201 |
| `GET /records/:id` | One record, or 404 |
| `GET /records/:id/transcripts` | Every transcript of a recording (C3) |
| `POST /sites` | Takes a place without an id or slug, makes both (C13) |
| `GET /sites?q=…` | Places whose name or other names contain the text. Never matches an address |
| `GET /sites/:id` | One place, or 404 |

None of the sites routes return an address. "Addresses stay private" below says why.

It passes the same rules the real API has to pass: `src/capture.test.ts` runs
`@sagas/fixtures/capture/rules` against it over HTTP.

**The intelligence layer's API** (`@sagas/mock-apis/graph`):

| Route | What it does |
| --- | --- |
| `POST /score` | Takes a place's graph, returns a score for every claim and detail |
| `POST /claims` | Takes a claim, checks it against `claimNode`, answers 201 |
| `GET /claims/:id` | One claim, or 404 |

The mock makes up its scores, and they mean nothing, the same as the fixtures' own stand-in. Build on the
shape, never on a value. `POST /claims` is this mock's own name, because S10 doesn't name its
route. The real API's `ENDPOINTS.md` says which name it uses.

Both start with the fixture places and records, and keep whatever you send them in memory, so it
disappears when they restart. Nothing they make up ever reaches a database.

## Using it in the reading site

Mount both mocks on one route handler. Add `@sagas/mock-apis` to `apps/web`'s dependencies
(`workspace:*`) and to `transpilePackages`, then create
`src/app/api/mock/[layer]/[[...path]]/route.ts`:

```ts
import { createCaptureMock, createGraphMock } from '@sagas/mock-apis';

const capture = createCaptureMock({ basePath: '/api/mock/capture' });
const graph = createGraphMock({ basePath: '/api/mock/graph' });

async function handle(request: Request, { params }: { params: Promise<{ layer: string }> }) {
  const { layer } = await params;
  if (layer === 'capture') return capture(request);
  if (layer === 'graph') return graph(request);
  return Response.json({ error: `No mock called ${layer}.` }, { status: 404 });
}

export { handle as GET, handle as POST };
```

Then read each API's address from a setting, and point it at the mock until the real API is
released:

```
CAPTURE_API_URL=/api/mock/capture
GRAPH_API_URL=/api/mock/graph
```

Moving to the real API means changing the address. If the real one has a problem, change it back.
Switch it on purpose. Don't fall back automatically when a call fails, because then a reader could
see invented places as if they were real ones, without anyone noticing.

## Using it on its own

The other two teams can run a mock on the port their real API uses:

```bash
pnpm --filter @sagas/mock-apis serve:capture
```

```bash
pnpm --filter @sagas/mock-apis serve:graph
```

`PORT` changes the port.

## What's deliberately missing

- Uploads and presigned URLs. They come with the storage work.
- The request queues (C7, C8) and transcript coverage (C4).
- Matches between claims. `POST /score` always returns an empty list.
- Anything persistent. That's the point of a mock.

## Addresses stay private

The sites routes never return a place's `address`. The mock still keeps it. The sponsor decided on
12 November that Sagas can store an address but never shows one, and an API anyone can call shows
whatever it returns. That's the one place the mock differs from the contract's `site`, which still requires
`address` until the location update.
