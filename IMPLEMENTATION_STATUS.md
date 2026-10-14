# NovaStore — Implementation Plan & Status

A production-style, full-stack e-commerce application.

## Environment findings (Stage 1)
- Existing static prototype preserved untouched at `f:\VScode\clothing-shop` (index.html/app.js/styles.css — mock shop, localStorage cart, fake checkout). Not modified.
- No Node.js, npm, or PostgreSQL were installed. Installed portable **Node.js v24.21.0 + npm 11.19.0** to `C:\Users\Nova\AppData\Local\node` (added to user PATH; no admin needed). Network access confirmed.
- Full-stack app scaffolded at `f:\VScode\store` with **create-next-app**: Next.js 16.4 (App Router), React 19, TypeScript (strict), Tailwind CSS 4 (Turbopack), ESLint.

## Documented technology decisions
- **Database:** PostgreSQL is the production target, but none is available here. Schema uses `provider = env("DATABASE_PROVIDER")` and is kept **database-agnostic** (String enums, Int money, no scalar arrays, no PG-only types). It runs on **SQLite** out-of-the-box for local dev and is fully Postgres-compatible. Postgres setup documented in README.
- **Auth:** Secure, custom session-based auth. Random opaque session token stored in DB, delivered in an `httpOnly`, `SameSite=Lax`, `Secure`(prod) cookie. Passwords hashed with `bcryptjs`. Roles: `CUSTOMER`, `ADMIN`. No default/hidden admin — a documented CLI script creates the first admin.
- **Payments:** Cash on Delivery fully implemented. Online payments via a provider interface; a **Stripe test-mode adapter** is implemented (REST + HMAC webhook verification using `node:crypto`, no paid deps) and only activates when Stripe env keys are present. Success is never invented — orders only confirm on verified provider response/webhook.
- **Money:** stored as integer **minor units** (paisa). All totals/discounts/tax/stock recalculated server-side; browser values never trusted.
- **Rate limiting:** lightweight in-memory sliding-window limiter for sensitive endpoints (documented limitation: single-instance; swap for a shared store in multi-instance prod).

## Stages
- [x] Stage 1: Inspect & plan
- [x] Stage 2: Foundation (schema, migrations, seed, lib, UI kit, layouts, verify boot)
- [x] Stage 3: Storefront (home, catalogue, category, product, search, filters/sort/pagination)
- [x] Stage 4: Customer (auth, cart, wishlist, account, addresses, reviews)
- [x] Stage 5: Commerce (checkout, orders, inventory protection, COD, Stripe test mode)
- [x] Stage 6: Admin (RBAC, dashboard, products, categories, orders, customers, coupons, settings)
- [x] Stage 7: QA (lint, typecheck, build, fixes)
- [ ] Stage 8: Delivery (README, admin creation, config docs)

## Completed Features

### Foundation
- Prisma schema with all required models (User, Address, Product, ProductImage, Category, ProductVariant, Cart, CartItem, Wishlist, WishlistItem, Order, OrderItem, Payment, Coupon, CouponRedemption, Review, NewsletterSubscription, ContactMessage, OrderStatusHistory, StoreSetting)
- SQLite database for local development (PostgreSQL compatible)
- Seed script with sample categories, products, variants, images, reviews, and coupons
- Core lib modules: prisma, money, utils, constants, settings, crypto, auth, validation, rate-limit, cart, email
- UI components: button, input, textarea, label, select, dialog, card, badge, skeleton, toast, avatar, dropdown-menu, tabs, separator, slot
- Theme provider with dark/light mode support
- Layout components: site-header, site-footer, cart-badge, wishlist-badge, header-search, header-nav, theme-toggle

### Storefront
- Home page with hero, feature strip, categories grid, product sections (featured, new arrivals, on sale, best sellers), testimonials, newsletter
- Products listing page with pagination, sorting, filtering (category, brand, price range, stock, sale)
- Category pages with product grid
- Product detail page with image gallery, variant selection, add to cart, wishlist, reviews
- Search page with suggestions
- Shopping cart page with quantity updates, coupon application, shipping preview
- Checkout page with address selection/entry, shipping method selection, payment method (COD/Stripe), order summary
- Checkout success page with order confirmation

### Customer Features
- Registration with email verification
- Login/logout with session management
- Password reset with secure tokens
- Customer account dashboard with profile, order history, addresses
- Address management (add, edit, delete, set default)
- Wishlist (add/remove, persistent for signed-in users)
- Product reviews (submit, update, verified purchase badges)
- Cart persistence (guest and signed-in, merge on login)

### Commerce
- Server-side cart computation (prices, discounts, shipping, tax)
- Coupon system (percent, fixed, free shipping with validation)
- Checkout flow with stock validation and atomic inventory decrement
- Order creation with full snapshots (items, prices, addresses)
- Cash on Delivery payment flow
- Stripe test-mode integration (activates when keys configured)
- Order confirmation emails (logged to console in dev)
- Order status history tracking

### Admin Panel
- Dashboard with revenue, orders, customers, low stock, recent orders
- Product management (create, edit, delete, variants, images, stock, pricing)
- Order management (list, filter, update status, view details)
- Customer management (list, search, view orders, toggle role)
- Coupon management (create, toggle, limits)
- Store settings (currency, tax, shipping, branding)
- Review moderation (approve/reject/delete)

### QA
- ESLint passes with 0 errors
- TypeScript type checking passes
- Production build succeeds
- All 25 routes compile correctly

## Remaining / limitations
- **README** needs comprehensive setup instructions, environment variable documentation, and deployment guide
- **Database migrations** need to be run for first-time setup (`npm run prisma:migrate`)
- **Stripe webhook endpoint** implemented but requires Stripe CLI or ngrok for local testing
- **Email delivery** requires SMTP configuration (falls back to console logging in dev)
- **Tests** (unit/integration) not yet implemented
- **PostgreSQL setup** documented but not tested in this environment
- **Admin creation script** available at `npm run create-admin`