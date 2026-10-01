# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

L-POS: a multi-warehouse (branch) point-of-sale system for retail, restaurant (tables, kitchen status, delivery) and cinema (showtimes, seat reservations). It runs on Next.js App Router (frontend and API in one app), MySQL through Knex, and Tailwind/shadcn-style UI. The UI is translated with `next-intl` (`messages/en`, `messages/km`). Money can be USD or KHR. The full DB schema reference is `.github/ai/DATABASE_SCHEMA.md`.

## Commands

```bash
npm run dev          # next dev --turbopack
npm run build
npm run typecheck    # tsc --noEmit --skipLibCheck
npm run lint         # next lint
npm run staged       # typecheck + lint, which is what CI (.github/workflows/check.yaml) runs
npm run migrate      # knex migrate:latest (src/lib/db/migrations); uses DB_MAIN from .env
npm run migrate:make -- <name>
npm run table        # regenerate src/generated/tables/* TS types from the live DB schema
npm run cron         # scheduled jobs runner (src/lib/cron)
```

- There is no test framework. To check pure logic, run a scratch script with `npx tsx <file>.ts`.
- `DB_MAIN` in `.env` may point at a shared or live database. Don't run `migrate` or `table` without confirming which database it targets.
- Pushing to `develop` deploys to stage (CapRover).

## Architecture

**API routes** (`src/app/api/**/route.ts`): a route usually re-exports handlers from sibling files (`create-x.ts`, `get-x.ts`, …).
- Every handler is wrapped in `withAuthApi` (`src/lib/server-functions/with-auth-api.ts`). The wrapper provides `{ db, req, body, params, userAuth, logger }`.
- `userAuth.admin.currentWarehouseId` is the active branch. Most data is scoped by `warehouse_id`.
- The second argument sets the allowed callers (`["ADMIN", "CUSTOMER", "PUBLIC"]`). The public `/menu` ordering flow uses CUSTOMER tokens.
- Validate input with zod. Audit mutations with `logger.serverLog(...)`.

**Business logic** goes in `src/classes/*` (service classes constructed with a Knex instance or transaction), not in routes. Use `db.transaction` for multi-table writes. Batch per-entity reads through DataLoaders created via `LoaderFactory` (`src/dataloader/loader-factory.ts`).

**DB conventions:**
- UUID string ids from `generateId()`.
- Soft delete via `deleted_at`.
- Timestamps are strings from `Formatter.getNowDateTime()` (Asia/Phnom_Penh, `YYYY-MM-DD HH:mm:ss`).
- Row types are `table_*` interfaces in `src/generated/tables`. When you add a table or column, add a migration and update or regenerate the matching type file, plus the export in `src/generated/tables.ts`.

**Client data access:** SWR hooks in `src/app/hooks/use-query-*.ts`, built on `useGenericSWR` / `useGenericMutation` (`use-generic.ts`). Hooks import request and response types from the API route files, so use `import type` when the source module has server-only code.

**i18n:** Khmer (`km`, the default) and English (`en`). Each namespace is one `messages/<locale>/<ns>.json` file listed in `src/i18n/namespaces.ts`, used via `useTranslations("<ns>")`. Keep `en` and `km` key sets identical. For validation errors shown in translated UIs, the API returns translation keys and the client translates them (see `usePromotionSetI18n`).

**Admin pages** (`src/app/admin/(admin)/<feature>/page.tsx`) are thin. They wrap a `Layout*` component from `src/components/gui/<feature>/` in `withLayoutPermission(Component, resource)`.
- Resources and default role permissions live in `src/lib/permissions.ts`.
- Route guards use `src/lib/menu-routes.ts` together with `src/middleware.ts`.
- When you add a menu route, keep `menu-routes.ts`, the menu items and `DEFAULT_ROLE_PERMISSIONS` in sync.
- Forms open as imperative sheets and dialogs: `createSheet` / `createDialog`, then `await sheetX.show(props)`.
- Use `LoadingState` / `EmptyState` from `src/components/ui/state.tsx`.

### Order pricing engine (read before touching discounts or totals)

Each order line (`customer_order_detail`) stores `price`, `qty`, `discount_amount`, `modifer_amount` (sic) and `total_amount`. Every discount on a line is a `discount_log` row, and the sentinel `discount_id` says what kind it is:

| `discount_id` | Meaning | Resolved by |
|---|---|---|
| `promo:<promotion_set.id>` | Promotion set / combo (e.g. buy 6 beers get 2 + 1 meat free) | `syncPromotionSetLogs` across the whole order, using `src/lib/promotion-set.ts` |
| `variant` | Product-variant menu discount, capped per `ORDER_DISCOUNT_RULES.maxQtyPerLine` | `computeVariantDiscount` (`src/lib/variant-discount.ts`) |
| `<discount.discount_id>` | Campaign discount applied to an item | per line, stacked |
| `manual` (`is_manual_discount=1`) | Cashier discount | per line, on the already-reduced price |
| `order` | Order-level threshold discount (amount or qty rule) | `recalculateOrderLevelDiscount`, allocated across lines proportionally |

Discounts are applied in this order: promo → variant/campaign → manual → order slice.

- The entry point is `recalculateCustomerOrder(orderItem, trx)` in `src/classes/order.ts`. It rebuilds the line, then calls `recalculateOrderLevelDiscount` (`src/classes/order-discount.ts`). That pass rebuilds every line from gross and is idempotent.
- Creating an order, adding an item and deleting an item call `applyVariantDiscountLogs` / `refreshOrderPromotions` so order-wide discounts get re-evaluated.
- Promotion-set timing (date range and daily happy-hour window) is judged per line by when the line was added (`customer_order_detail.created_at` → `orderedAt`), not by the current time. So `PromotionSetService.getActive` deliberately doesn't filter by now.
- Order-wide rules come from the `setting` row `ORDER_DISCOUNT_RULES`, with a per-warehouse override (`src/lib/order-discount-rules.ts`).
- **Client mirror:** the restaurant POS recomputes cart totals locally in `RestaurantaAction.calculateOrderTotal` / `calculateItemTotals` (`src/components/gui/restaurant/class/restaurant.ts`). It uses the same pure functions (`computeVariantDiscount`, `resolveVariantUnitCapByLine`, `applyPromotionSets`), with rules and promotion sets loaded into restaurant state. Any change to pricing math must go in the shared `src/lib/*` function so server and client stay identical. Keep rounding as integer-cents flooring.
- Restaurant menu: running promotion sets show as cards (a "Promotions" category, and first under "All"), in `src/components/gui/restaurant/promotion/`. A tap loads `/api/promotion-set/[id]/choices` and asks the cashier only for items that have several options. `selectPromotionSet` then adds every line. The price still comes from the promotion engine, not from the card.
- The retail POS (`src/components/gui/pos`) and the public menu cart don't mirror this math. They refetch when the server reports `variantDiscountApplied` / `promotionApplied`.

### Restaurant POS state

`src/components/gui/restaurant/contexts` holds a `useReducer` + immer store (`RestaurantState`), initialised by `restaurant-layout.tsx` from SWR data.
- Mutations call the API first, then dispatch actions handled by static methods on `RestaurantaAction`.
- `SYNC_STATE` re-syncs from server data when the table query finishes revalidating. Add new server-derived state fields to that payload in `restaurant-context.tsx`.
