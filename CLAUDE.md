# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An n8n community node package (`n8n-nodes-timix`) exposing the Timix HR API to n8n. It ships **one** node (`Timix`) with a resource/operation selector — Chat, Employee, Employee Honor, File, Honor, Offer, Task — plus one credential type (`timixHrApi`). Tooling is `@n8n/node-cli` (`n8n-node`), TypeScript compiled to CommonJS in `dist/`.

## Commands

```bash
npm ci                 # install from lockfile
npm run build          # n8n-node build → dist/ (also copies icons/static files)
npm run dev            # start n8n in dev mode with this package loaded
npm run lint           # n8n ESLint config; lint:fix to auto-fix
npm test               # builds, then runs node --test tests/**/*.test.js
```

Tests are plain CommonJS using `node:test` and they `require()` the **compiled** files under `dist/`, so a build must happen before any test run. To run a single file or test:

```bash
npm run build && node --test tests/chat-helpers.test.js
node --test --test-name-pattern="update honor" tests/honor-helpers.test.js   # after a build
```

Deploy a build to a local n8n custom folder: `N8N_CUSTOM_DIR=<path> ./scripts/deploy_custom.sh` (wipes and recopies `<dir>/n8n-nodes-timix` from `dist/` + `package.json`; does not build or restart n8n).

## Architecture

Request flow, which spans several files:

1. `nodes/Timix/Timix.node.ts` — builds the UI by spreading each resource's `*Operations` and `*Fields` arrays from `resources/<Resource>/description.ts`. Its `execute()` loops over input items and dispatches with a chain of `if (resource === … && operation === …)` checks to an operation function called as `fn.call(this, itemIndex)`. Honors, EmployeeHonors and Offers instead route to a single `execute*` function that switches on `operation` internally. **Adding an operation means adding both the description entry and a dispatcher branch here.**
2. Operation files read parameters, validate/build the body via **pure helpers** (`resources/<Resource>/helpers.ts`), then call `timixApiRequest()`.
3. `resources/shared.ts` → `timixApiRequest(context, itemIndex, options, service = 'hr')` is the only HTTP entry point. It:
   - picks `baseURL`: credential `filesBaseUrl` when `service === 'files'` and it's set, otherwise `baseUrl` (gateway setups leave Files URL empty). Only file upload uses `'files'`.
   - if the node-level `accessTokenOverride` ("Dynamic Credential") parameter is non-empty, sends `Authorization: Bearer <override>` via `helpers.request`; otherwise uses `helpers.requestWithAuthentication('timixHrApi', …)` so the credential's bearer token is injected.
4. Results become `INodeExecutionData` with `pairedItem: { item: itemIndex }`. `responseToExecutionData()` unwraps the HR `{ payload: … }` envelope (`unwrapHrPayload`) and splits arrays into one item per record unless the `includeMetadata` option is set.
5. Errors: with `continueOnFail`, the original input JSON is emitted with the error; otherwise errors are rethrown as `NodeOperationError` with `itemIndex` context.

Other shared conventions in `shared.ts`:
- `normalizeUuidList` / `collectUuids` accept UUIDs as strings, comma lists, JSON strings, arrays, or objects (`uuid`/`id`/`fileUuid`, nested `file`, `data`/`files`/`items` arrays) and dedupe — use these for any UUID-list input.
- `extractCollectionValues` reads n8n `fixedCollection` `{ values: [...] }` shapes.
- Optional empty strings are omitted from request bodies (`normalizeOptionalString`); meaningful `false`/`null` must be preserved.

Domain rules worth knowing:
- Honor / Employee Honor use **public UUIDs** only; numeric employee IDs are not accepted.
- PATCH-style updates distinguish keep / set / clear (clear sends explicit `null`, e.g. `fileUuid: null` to remove a honor image). Keep that three-way distinction when adding update fields.
- "Return All" pagination (Honors, Employee Honors) pages 100 at a time with a hard 1000-page cap.
- File upload sends multipart to the Files service, max 10 binary properties per request; defaults to all binary fields on the item if none are listed. The multipart request itself lives in `Files/helpers.ts` (`uploadBinaryProperties`).
- Offer / Complaint share `POST /api/v2/offers` (`type` fixed by the operation). The API stores unknown body keys, so send only documented fields. Files are attached by passing already-uploaded UUIDs as `fileUuids` (the node does not upload them). It is not idempotent (creates a record + notifications per call): never add retries. HTTP errors are mapped to `NodeApiError` with status and API `message` in `Offers/execute.ts`.
- Credential test hits `GET /api/v2/health` on the HR base URL. Endpoints are under `/api/v2/...`.

## Testing pattern

Tests build a fake `IExecuteFunctions` (`getNodeParameter`, `getCredentials`, `helpers.requestWithAuthentication` that records `requestOptions`) and assert on payload helpers plus the captured method/URL/body. Follow the existing `createExecutionContext` helper in `tests/*.test.js` when adding tests for new operations.

## Docs to keep in sync

User-facing node docs live in `nodes/Timix/Timix.node.md` (per-operation parameters, validation, behavior). When changing an operation's UI fields or API contract, update the description, helper, operation, test, and this doc together.

## Known issues (as of v1.1.1)

- `package.json` `n8n.credentials` / `n8n.nodes` point at `dist/**/*.ts`, but the build emits `.js`; the published package likely won't load in n8n until these are changed to `.js`.
- README describes a `build_timix_node.sh` that doesn't exist; `scripts/build_assets.sh` has broken relative paths and isn't wired into any npm script (`n8n-node build` already copies icons).
- `Timix.node.md` says file upload returns `uuids`, `fileUuids` and `response`; the code returns only `uuids` when UUIDs are found.
- No CI (`.github/workflows/` is empty).
- `workflows/timix-message-reaction.json` is a standalone n8n HTTP Request workflow (add/remove reaction), not used by the node code.
