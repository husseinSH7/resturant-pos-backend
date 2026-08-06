# Final Production Roadmap — Restaurant POS SaaS

**Scope:** `kirmitatom/pos-mobile` (Expo/React Native POS app) + `kirmitatom/restaurant_POS` (backend + dashboards).  
**Goal:** Move from a feature-complete demo to a secure, multi-tenant, production-ready SaaS.

---

## 0. Architecture target

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN DASHBOARD                      │
│  (your dashboard only — create restaurants, plans, billing,      │
│   set screen/table limits, suspend/activate accounts)            │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                     RESTAURANT OWNER DASHBOARD                     │
│  (one per restaurant — analytics, menu, staff, tables,           │
│   inventory, reservations, settings)                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                         MOBILE POS APP                            │
│  (staff login with PIN per restaurant — order, payment, kitchen, │
│   tables, offline sync)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Account model
- **Super Admin** (`PlatformAdmin`) — you, login with email/password. Only role that can create/activate/delete restaurants and set pricing/limits.
- **Restaurant Owner** — email/password login. Manages one or more restaurants, can add staff, products, tables, etc. Cannot create new platform accounts.
- **Restaurant Staff** — PIN login on mobile/tablet. Works inside one restaurant only.
- **Plan/Subscription** — each restaurant is on a plan that defines `maxScreens`, `maxTables`, `maxStaff`, `maxLocations`, feature flags, and price.
- **Device/Screen** — each POS/KDS/manager tablet registers as a device; API enforces the screen limit from the plan.

---

## Phase 1 — Security & Auth Foundation (weeks 1–2)

Make the stack safe before adding tenants or revenue logic.

| Deliverable | What it covers |
|---|---|
| Hashed credentials | Hash PINs with bcrypt for staff; email/password owners with bcrypt + salt. Remove plaintext PIN storage. |
| RBAC middleware | `requireRole(...)` for routes; only `OWNER`/`MANAGER` can manage staff/menu/settings; only `OWNER` can change billing/plan. |
| CORS & headers | Lock `cors` to known origins, add `helmet` security headers. |
| WebSocket auth | Authenticate socket connections and verify `restaurantId` before joining rooms. |
| Rate limiting | Login/brute-force protection (`express-rate-limit`). |
| JWT hardening | Refresh tokens, `isActive`/role revalidation on every request, short access-token expiry. |
| Input validation | Apply Zod to every controller; remove `any` types in service layers. |
| Audit logging | Log every login, staff change, void, refund, plan change. |

**UI:** no new screens; backend-only.  
**Milestone:** Security audit checklist passes locally.

---

## Phase 2 — Multi-Tenant SaaS Data Model (weeks 3–4)

Build the platform layer that turns a single-tenant POS into a SaaS.

| Deliverable | Details |
|---|---|
| `Plan` table | name, basePrice, maxTables, maxScreens, maxStaff, maxLocations, features JSON. |
| `Subscription` / billing status | trialUntil, paidUntil, status (`TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED`). |
| `PlatformAdmin` / `RestaurantOwner` | Separate from `User` staff table; or extend `User` with `type` and nullable `restaurantId`. |
| `Device` registration | deviceId, restaurantId, type (`POS`, `KDS`, `MANAGER_TABLET`), lastSeenAt, isActive. |
| License enforcement | Gate create/update endpoints for tables, devices, staff by plan limits. |
| Billing status gate | Middleware rejects all write operations if subscription is `SUSPENDED`/`CANCELLED`. |

**UI:** no new screens; schema + middleware + seed data for default plans.  
**Milestone:** API rejects an over-limit table creation.

---

## Phase 3 — Super Admin Dashboard (proper UI) (weeks 5–6)

A dedicated dashboard **only for you** to manage the whole platform.

| Page / Feature | Function |
|---|---|
| Restaurants list | Search, filter, view subscription status, plan, owner, screen/table counts. |
| Create restaurant + owner | Form to set restaurant name/slug, assign owner email/password, select plan. |
| Plans & pricing | CRUD plans and set limits/prices. |
| Per-restaurant limits | Override `maxScreens`, `maxTables`, `maxStaff`. |
| Billing / subscription | Activate/suspend/cancel, extend trial, change plan, view invoices. |
| Global analytics | Total restaurants, active screens, revenue, MRR. |
| Audit log viewer | Platform-wide login and admin actions. |

**UI stack:** keep React + Tailwind + shadcn/ui, add a proper sidebar, data tables, modals, toast notifications.  
**Milestone:** You can create a restaurant + owner from this dashboard and the owner can log in.

---

## Phase 4 — Restaurant Owner Dashboard (proper UI) (weeks 7–8)

The dashboard each restaurant owner uses to run their business.

| Page / Feature | Function |
|---|---|
| Login | Email/password + 2FA later. |
| Home / analytics | Sales today, active tables, top items, staff on shift. |
| Menu | Categories, products, modifiers with proper forms and image upload. |
| Tables | Visual floor-plan editor (drag-and-drop), table configuration. |
| Staff | Add/edit staff with PIN and role; performance dashboard. |
| Inventory | Ingredients, recipes, stock adjustments, low-stock alerts. |
| Reservations | Calendar, waitlist, confirmations. |
| Customers / loyalty | Profiles, points, gift cards. |
| Settings | Tax, receipt, printers, business profile. |

**UI stack:** React + Tailwind + shadcn/ui, responsive, keyboard shortcuts, real-time updates via WebSocket.  
**Milestone:** Owner can fully configure a restaurant and view live analytics.

---

## Phase 5 — Unified Authentication & Onboarding Flow (weeks 9–10)

Connect the two dashboards and the mobile app to one identity system.

| Deliverable | Details |
|---|---|
| Super admin login | `POST /auth/platform/login` returns token with `PLATFORM_ADMIN` role. |
| Owner login | `POST /auth/owner/login` returns token scoped to restaurant(s). |
| Staff PIN login | `POST /auth/login` with PIN + `restaurantId` (or device context). |
| Password reset / email verification | For owner accounts; integrate a transactional email provider. |
| Secure token storage | Mobile: `expo-secure-store`; Web: httpOnly cookies or `localStorage` only for non-sensitive token with XSS hardening. |
| Onboarding flow | Optionally allow super admin to send an owner invite link; owner sets password and lands in dashboard. |

**Milestone:** All three user types can log in through their respective entry points and only access allowed data.

---

## Phase 6 — Core POS Reliability (weeks 11–13)

Make order, payment, and kitchen flows robust.

| Deliverable | Details |
|---|---|
| Input validation | Zod schemas on every endpoint; reject malformed orders. |
| Split payments | `order_splits` + `payment_splits` tables; split by person, item, or custom amount. |
| Mixed payments | Allow multiple payment records per order (cash + card + gift card). |
| Tax / receipt settings | Persist in database; remove hard-coded 8%. |
| Inventory deduction | Decrement ingredients on order completion; handle refunds/re-voids. |
| Kitchen ticket lifecycle | Reliable PENDING → PREPARING → READY → COMPLETED with modification highlighting. |
| Order void/refund workflow | RBAC, reason required, audit log. |
| Offline sync hardening | Conflict resolution, retry with backoff, queue cleanup. |

**UI:** improve mobile payment screen, order screen modal behavior on native, table status colors.  
**Milestone:** A full order can be created, split, paid, and kitchen-closed without data errors.

---

## Phase 7 — Advanced Features & Market Gaps (weeks 14–16)

Close the gaps vs Toast/Square that were flagged in `roadmap.md`.

| Deliverable | Details |
|---|---|
| Visual floor-plan editor | Drag-and-drop, shapes, rotation, areas. |
| Reservation system | SMS/email confirmations, waitlist, no-show tracking, calendar. |
| Loyalty & gift cards | Points accrual/redemption, gift card purchase/balance, customer analytics. |
| Sales forecasting & labor cost | Basic forecasting by day/hour; labor cost vs sales. |
| Marketing campaigns | Targeted SMS/email campaigns to customers. |
| Advanced reporting | Export CSV/PDF, custom date ranges, peak-hour analysis. |

**UI:** add charts (recharts or tanstack charts), export buttons, campaign composer.  
**Milestone:** Feature parity with the `roadmap.md` advanced section.

---

## Phase 8 — Mobile App Polish & Native Builds (weeks 17–18)

Make the mobile app ready for Play Store / App Store and real devices.

| Deliverable | Details |
|---|---|
| Native UI | Replace Expo-web workarounds (`Modal`, `ScrollView`) with React Native components that work on iOS/Android. |
| Secure storage | Use `expo-secure-store` for tokens and PIN. |
| Native offline SQLite | Fix `wa-sqlite` web fallback; ensure native SQLite works. |
| Push notifications | Order status, kitchen ready, shift reminders. |
| Printing & peripherals | Receipt/kitchen printer, cash drawer, barcode scanner integration. |
| EAS builds | `eas build --platform ios/android`, app store metadata. |

**Milestone:** Production `.apk` / `.ipa` build succeeds and installs on a real device.

---

## Phase 9 — Testing, CI/CD & Observability (weeks 19–20)

Make the system production-grade.

| Deliverable | Details |
|---|---|
| Backend tests | Vitest/Jest unit tests; Supertest integration tests for every route. |
| Dashboard E2E | Playwright coverage for owner/super-admin flows. |
| Mobile E2E | Maestro or Detox for login/order/payment. |
| CI/CD | GitHub Actions: lint, typecheck, test, build, deploy. |
| Monitoring | Sentry for errors, Datadog/Logtail for logs, health checks. |
| Backup & DR | Automated DB backups, point-in-time restore, Redis persistence. |
| Load testing | 100+ concurrent users, 99.9% uptime target. |

**Milestone:** All critical paths have automated tests; CI passes green.

---

## Phase 10 — Production Launch (weeks 21–22)

Ship and support.

| Deliverable | Details |
|---|---|
| Hosting | Fly.io/Railway/Render for API; Vercel/Netlify for dashboards; CloudFront/S3 for assets. |
| SSL / CDN / WAF | HTTPS everywhere, Cloudflare, API gateway with rate limits. |
| Compliance | PCI-DSS scope reduction (no card data), GDPR deletion flows, SOC 2 prep. |
| Documentation | Owner guides, staff quick-start, API docs. |
| Pilot program | 3–5 beta restaurants, feedback loop. |
| Support system | Help desk, in-app feedback. |

**Milestone:** Public launch with first paying restaurants.

---

## Total timeline

- **MVP production-ready SaaS:** ~10 weeks (Phases 1–5)  
- **Full feature parity + advanced:** ~16 weeks (Phases 1–7)  
- **Store-ready mobile + production launch:** ~22 weeks (all phases)

---

## Critical next step

**Start with Phase 1 (Security & Auth Foundation).** Do not build the super-admin dashboard or tenant model until PINs are hashed, RBAC is enforced, and the API is not wide open. The smoke test already confirmed the mobile golden path works, so the priority is hardening and the SaaS layer, not new POS features.
