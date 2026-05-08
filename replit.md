# Bakong KHQR Payment Gateway

A web app for Cambodian merchants to generate Bakong KHQR QR codes and check payment status using the Bakong NBC API.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/khqr-payment run dev` — run the frontend (port 21416)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `BAKONG_TOKEN` — JWT token for Bakong NBC API

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- QR rendering: qrcode.react

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all contracts)
- `lib/db/src/schema/payments.ts` — payments table schema
- `artifacts/api-server/src/routes/payment.ts` — Bakong payment routes
- `artifacts/khqr-payment/src/` — frontend React app
- `artifacts/khqr-payment/src/pages/` — page components (generate-qr, check-payment, history, pos)
- `artifacts/khqr-payment/src/components/sidebar.tsx` — sidebar navigation

## Architecture decisions

- Contract-first: OpenAPI spec gates all codegen; never hand-write API types
- `lib/api-zod/src/index.ts` only exports `./generated/api` (not `./generated/types`) to avoid duplicate export errors from orval split mode
- Bakong API calls are proxied through the Express server to keep the token server-side
- Payments are stored locally in PostgreSQL for history tracking
- QR polling: after generating a QR, the frontend polls `/api/payment/check/:md5` every 3s via React Query `refetchInterval`

## Product

- **Generate QR**: Enter amount + currency (USD/KHR), get a KHQR code that auto-polls for payment confirmation
- **Check Payment**: Look up any payment by MD5 hash
- **History**: View last 50 transactions with paid/pending status
- **POS Info**: View Bakong POS terminal info for the account

## User preferences

- Bakong token stored as `BAKONG_TOKEN` secret

## Gotchas

- After changing `openapi.yaml`, always run codegen AND manually verify `lib/api-zod/src/index.ts` only has `export * from "./generated/api"` (the codegen script patches this automatically now)
- The codegen script patches the api-zod index after orval runs to prevent duplicate export errors

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Bakong API base: `https://bakong.nbc.gov.kh`
