# TechMart — Technical & Product Documentation

**Version:** 1.0
**Last updated:** July 2026
**Repository:** https://github.com/Salim12344/techmart
**Live site:** https://techmart-zeta.vercel.app

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [Database Models](#5-database-models)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Customer User Flows](#7-customer-user-flows)
8. [Admin User Flows](#8-admin-user-flows)
9. [API Reference](#9-api-reference)
10. [Key Business Rules & Design Decisions](#10-key-business-rules--design-decisions)
11. [Cart System (Deep Dive)](#11-cart-system-deep-dive)
12. [Payment & Stock Integrity (Deep Dive)](#12-payment--stock-integrity-deep-dive)
13. [Coupon System (Deep Dive)](#13-coupon-system-deep-dive)
14. [Email System](#14-email-system)
15. [Environment Variables](#15-environment-variables)
16. [Local Development](#16-local-development)
17. [Deployment](#17-deployment)
18. [Known Issues & Future Work](#18-known-issues--future-work)

---

## 1. Project Overview

TechMart is a full-stack e-commerce platform for Apple products, built for the Nigerian market (currency: Naira, ₦). It covers the full retail loop: product catalog with variants (color × storage), guest and authenticated shopping, Paystack-powered checkout, order lifecycle management, customer support ticketing, dispute/refund handling, product reviews with moderation, and a complete admin back office.

The UI is built entirely with **inline styles** (no CSS framework) using a consistent design token object (`C`) repeated across components, styled to resemble Apple's own retail site.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server/Client Components) |
| Database | MongoDB Atlas via Mongoose ODM |
| Auth | NextAuth v4 (JWT session strategy) — Credentials + Google OAuth |
| Payments | Paystack (hosted redirect flow, NGN) |
| Email | Resend |
| Image hosting | Cloudinary |
| Icons | lucide-react |
| Animation | `motion` (Framer Motion) |
| Hosting | Vercel |

No TypeScript — the codebase is plain JavaScript/JSX throughout.

---

## 3. Architecture

TechMart follows the standard Next.js App Router convention: file-based routing, colocated API route handlers under `app/api/`, and a mix of Server and Client Components (most interactive pages are `'use client'` due to heavy `useState`/`useEffect` usage for cart, auth session, and form state).

### High-level request flow

```
Browser
  │
  ├─ Server-rendered pages (app/*/page.jsx)
  │     └─ Client components hydrate for interactivity
  │
  ├─ API routes (app/api/**/route.js)
  │     ├─ getServerSession(authOptions) for auth checks
  │     ├─ connectDB() → Mongoose → MongoDB Atlas
  │     └─ External calls: Paystack REST API, Resend, Cloudinary
  │
  └─ Client-side helpers (lib/*.js)
        ├─ lib/cart.js       — cart read/write (DB or localStorage)
        ├─ lib/guestWishlist.js — guest wishlist localStorage helper
        ├─ lib/formatPrice.js   — currency formatting
        └─ lib/orderFulfillment.js — server-side stock deduction/refund logic
```

### Database connection pattern

Every API route calls `connectDB()` from `lib/db.js` at the top of its handler. This uses a cached-connection pattern (a module-level promise) so repeated invocations in the same serverless function instance don't reopen a new connection:

```js
// lib/db.js (pattern)
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### DNS resolution note (local dev only)

This project has had a recurring Windows DNS resolution flake (`ESERVFAIL`/`EAI_AGAIN`) on external calls (MongoDB SRV lookup, Cloudinary) on the primary dev machine. `instrumentation.js` pins DNS servers to `8.8.8.8`/`1.1.1.1` for the whole Next.js server process at boot to mitigate this. It is not a Vercel/production concern.

---

## 4. Project Structure

```
app/
  (store)/              Customer-facing route group — wrapped in Navbar + Footer + BackToTop
    page.jsx               Homepage
    products/               Listing page + [id] detail page
    cart/                   Shopping cart
    checkout/               Checkout form + /success verification page
    orders/                 Order history + [id] detail
    wishlist/               Wishlist
    compare/                Side-by-side product comparison
    support/                Support tickets (list + [id] chat thread)
    disputes/               Customer dispute list
    account/                Profile, password, quick links
    faq/                    Static FAQ accordion

  admin/                 Admin route group — sidebar layout, role-gated
    layout.jsx              Shared sidebar + auth guard + live notification badges
    page.jsx                Dashboard (stats, quick actions, recent orders)
    products/                Product & category CRUD
    orders/                  Order management, status updates
    users/                   User list + order history per user
    coupons/                 Coupon CRUD
    disputes/                Dispute review + refund approval
    support/                 Ticket management
    reviews/                 Review moderation queue

  auth/                  Login, register, OTP verify, password reset, 2FA
  api/                   All route handlers (see §9)

models/                 Mongoose schemas
lib/                    Shared utilities (db, email, cart, formatPrice, orderFulfillment, guestWishlist)
components/ (app/components) Shared UI: Navbar, Footer, Toast, ConfirmDialog, BackToTop, Button
scripts/                One-off seed/migration scripts (not committed after running)
instrumentation.js      DNS pinning on server boot (local dev workaround)
```

---

## 5. Database Models

| Model | Collection | Registered as | Purpose |
|---|---|---|---|
| `User` | users | `'User'` | Accounts — name, email, password (plaintext, by design), role (`customer`/`admin`), phone |
| `Product` | products | `'product'` (lowercase) | Catalog entries with colors, storage options, and variants |
| `Order` | orders | `'order'` (lowercase) | Placed orders — items snapshot, shipping address, status, coupon |
| `Cart` | carts | `'Cart'` | One document per signed-in user — DB-backed cart |
| `Category` | categories | `'Category'` | Product categories with per-category spec-field templates |
| `Review` | reviews | `'Review'` | Product reviews — moderation flag, likes |
| `Wishlist` | wishlists | `'Wishlist'` | One doc per (user, product) pair |
| `Coupon` | coupons | `'Coupon'` | Discount codes — usage cap and per-user usage tracking |
| `SupportTicket` | supporttickets | `'SupportTicket'` | Customer support threads |
| `Dispute` | disputes | `'Dispute'` | Order disputes awaiting admin review |
| `Refund` | refunds | `'Refund'` | Refund records (from disputes or system-initiated) |
| `Subscriber` | subscribers | `'Subscriber'` | Newsletter/marketing email signups |
| `OTPToken` | otptokens | `'OTPToken'` | One-time codes for registration/reset/2FA |

> **Registered-name pitfall:** Mongoose's `mongoose.model(name, schema)` name must exactly match every `ref:` string elsewhere, or you get a "Schema not registered" runtime error. Note the inconsistent casing: `User` is capitalized, but `product` and `order` are lowercase. This is historical and intentional — do not "fix" the casing without updating every `ref` across the codebase.

### Product schema (core of the catalog)

```js
const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,          // free-text, NOT a foreign key — see §10 pitfalls
  description: String,
  image: String,              // main/fallback image
  warranty: String,
  tags: [String],
  colors: [{ name: String, hex: String, image: String }],
  storageOptions: [String],   // e.g. ['128GB', '256GB'] — empty for storage-less products
  variants: [{
    color: String, storage: String, sku: String,
    price: Number, stock: Number,
  }],
  specs: mongoose.Schema.Types.Mixed,  // free-form key/value, keys match Category.specFields
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });
```

A product's sellable unit is a **variant** — the unique combination of one color and one storage option (or just color, for storage-less products like AirPods). Every variant has its own SKU, price, and stock count.

### Order schema

```js
const OrderSchema = new mongoose.Schema({
  orderNumber: String,               // 'TM-' + Date.now()
  userId: { type: ObjectId, ref: 'User' },
  items: [{
    productId: ObjectId, productName: String,
    color: String, storage: String, sku: String,
    quantity: Number, unitPrice: Number,
  }],                                 // snapshot — never joined back to Product at render time
  shippingAddress: { fullName, phone, street, city, state, country },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'refunded', 'cancelled'],
    default: 'pending',
  },
  paymentVerifiedAt: Date,
  confirmedAt: Date, shippedAt: Date, deliveredAt: Date, cancelledAt: Date,
  totalAmount: Number,
  couponCode: String,
  paymentReference: String,
}, { timestamps: true });
```

Order items are a **frozen snapshot** at the moment of purchase — product name, price, color, storage are copied directly onto the order, never re-fetched from the live `Product` document. This means order history displays correctly forever, even if the underlying product is later edited, discontinued, or deleted.

### Coupon schema

```js
const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercent: { type: Number, required: true, min: 1, max: 10 },
  expiresAt: { type: Date, required: true },
  maxUses: { type: Number, required: true },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: ObjectId, ref: 'User' }],  // enforces one redemption per user
  isActive: { type: Boolean, default: true },
});
```

---

## 6. Authentication & Authorization

- **Strategy:** NextAuth v4, JWT session strategy (no server-side session store).
- **Providers:** Credentials (email/password, plaintext comparison) and Google OAuth.
- **Role model:** a single `role` field on `User`, either `'customer'` (default) or `'admin'`. There is no granular permission system — admin routes check `session.user.role === 'admin'` directly.
- **Google sign-in edge case:** the JWT callback re-resolves the user's real MongoDB `ObjectId` on every refresh, since Google-provided IDs are not Mongo ObjectIds and would otherwise leak into `session.user.id`.
- **Two-factor:** an optional OTP-based 2FA step exists (`/auth/verify-2fa`), separate from registration email verification.

### A typical protected API route

```js
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... proceed with session.user.id
}
```

### A typical admin-only API route

```js
const session = await getServerSession(authOptions);
if (!session || session.user.role !== 'admin') {
  return Response.json({ error: 'Unauthorized' }, { status: 403 });
}
```

Admin pages are additionally guarded client-side in `app/admin/layout.jsx`, which redirects non-admins away and shows a loading state while the session resolves.

---

## 7. Customer User Flows

### 7.1 Browsing (guest or signed in)

1. Homepage (`/`) shows a hero, live stats (`/api/stats` — real counts, not hardcoded), a "Explore Our Products" section (first 8 catalog products), category tiles, and a newsletter subscribe box.
2. `/products` shows the full catalog with search, category filter pills (toggle-style — click again to deselect), an "In Stock" toggle, and sort options.
3. Product detail (`/products/[id]`) — order of information: name → rating → color selector → storage selector → price & live stock badge → description → quantity stepper → Add to Cart.

### 7.2 Wishlist (guest → account merge)

- **Guest:** stored in `localStorage` via `lib/guestWishlist.js`.
- **Signed in:** stored server-side in the `Wishlist` collection via `/api/wishlist`.
- **On login:** any guest wishlist entries are POSTed to `/api/wishlist` one-by-one, then the local guest copy is cleared — see the merge effect in `app/components/Navbar.jsx`.

### 7.3 Cart (guest → account merge, DB-backed when signed in)

See [§11 Cart System](#11-cart-system-deep-dive) for full detail. Summary: guests get `localStorage`; signed-in users get a DB-backed `Cart` document that survives logout/login and syncs across devices; guest-cart contents are merged into the DB cart once, on login.

### 7.4 Checkout

1. `/checkout` — shipping address form, live re-check of stock for everything in the cart (redirects back to cart if anything's gone out of stock), optional coupon code entry.
2. `POST /api/checkout/session` validates stock and coupon eligibility, creates a `pending` Order, and initializes a Paystack transaction (hosted redirect, not the inline popup SDK).
3. Customer is redirected to Paystack's hosted payment page.
4. On return, `/checkout/success?reference=...` calls `GET /api/checkout/verify`, which confirms payment with Paystack and — only on genuine success — deducts stock atomically and clears the cart.
5. A backup webhook (`POST /api/webhooks/paystack`) performs the same confirmation logic in case the client-side redirect never completes (browser closed, network drop).

See [§12](#12-payment--stock-integrity-deep-dive) for the overselling-prevention logic that runs at this exact step.

### 7.5 Orders

- `/orders` — paginated list (5 per page), status badges.
- `/orders/[id]` — full detail: progress tracker (`pending → confirmed → shipped → delivered`), expected-delivery date range, and a **Cancel Order** button (only shown while status is `pending` or `confirmed`).
- Cancelling triggers a Paystack refund, restores stock for every item, releases any coupon usage tied to the order, and emails the customer.

### 7.6 Reviews

- A customer can only review a product they have a **delivered** order containing.
- New reviews save with `isApproved: false` — invisible to everyone except the author (marked "Pending approval") until an admin approves them from `/admin/reviews`.
- Product `averageRating`/`reviewCount` are recalculated from **approved reviews only**.
- Once approved, a review **cannot be unapproved** (admin can only delete it) — enforced both in the UI and server-side in the PATCH handler.
- Users can like other users' reviews (not their own).

### 7.7 Support

- `/support` — list + create tickets (category, subject, message).
- `/support/[id]` — chat-style thread, polls every 30s for admin replies.

### 7.8 Disputes

- Customer opens a dispute against a delivered order (`/disputes`), citing a reason (item not received, wrong item, damaged, change of mind).
- Admin reviews it in `/admin/disputes`; approving triggers a Paystack refund, restores stock, releases coupon usage, and marks the order `refunded`.

---

## 8. Admin User Flows

All under `/admin`, gated to `role === 'admin'`, with a persistent sidebar showing **live notification badges** (pending orders count, open disputes count, support tickets awaiting reply) that poll every 60 seconds and also refresh instantly on relevant actions via `window.dispatchEvent(new Event('admin-orders-read'))` (and the `-disputes-` / `-support-` equivalents).

### 8.1 Products & Categories

- Full CRUD on products: name, category, description, warranty, tags, colors (each requiring an uploaded image — enforced, see §10), storage options, per-variant price/stock, and category-driven spec fields.
- **Spec fields are per-product removable.** A category defines a template list of spec fields (e.g. "Mac" includes Display Size), but any individual product can mark a field "not applicable" (e.g. Mac mini has no display) without altering the category template — the removal only affects that one product's saved data, not the category itself.
- Categories are separately manageable, each with its own ordered list of spec fields (key, label, input type, unit, placeholder).
- **Deleting a product is blocked** while it's tied to any order that hasn't reached a terminal state (`delivered`, `cancelled`, or `refunded`) — see §10.

### 8.2 Orders

- Full order list with status filter tabs and search.
- Selecting an order shows full detail (same rendering function reused for desktop sidebar and mobile inline view) with a one-click "Mark as {next status}" button walking through `pending → confirmed → shipped → delivered`.

### 8.3 Users

- Lists all registered users with their real order history (`/api/admin/users` attaches each user's `orders` array by matching `userId`, since `User` has no `orders` field of its own).
- Selecting a user shows a scrollable order list (own scrollbar, doesn't require scrolling the whole page) where each order is color-coded by status (a softer/more muted palette than the main Orders page) and clickable — navigates to `/admin/orders?order={id}`, which auto-selects that order's full detail panel.

### 8.4 Coupons

- CRUD on discount codes: code, discount percent (capped at 10%), expiry, max total uses.

### 8.5 Disputes

- Review open disputes, approve (refund + stock restore + coupon release) or reject.

### 8.6 Support

- Reply to tickets, change status/priority.

### 8.7 Reviews

- Pending / Approved / All filter tabs.
- Approve pending reviews; delete any review (with an optional reason, emailed to the reviewer). No "unapprove" once approved.

---

## 9. API Reference

All routes are Next.js Route Handlers under `app/api/`. Grouped by resource; `[admin]` indicates `role === 'admin'` is required.

### Auth
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account, triggers OTP email |
| POST | `/api/auth/send-otp` / `resend-otp` | Send/resend an OTP |
| POST | `/api/auth/verify-otp` | Verify registration email |
| POST | `/api/auth/forgot-password` / `reset-password` | Password reset flow |
| POST | `/api/auth/verify-2fa` | Two-factor verification |
| * | `/api/auth/[...nextauth]` | NextAuth handler (login, session, callbacks) |

### Products
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products` | List all products (`Cache-Control: no-store`) |
| POST | `/api/products` `[admin]` | Create product |
| GET | `/api/products/[id]` | Single product |
| PATCH | `/api/products/[id]` `[admin]` | Update product |
| DELETE | `/api/products/[id]` `[admin]` | Delete product — **blocked** if active orders reference it |

### Cart
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/cart` | Get the signed-in user's DB cart |
| PUT | `/api/cart` | Replace the cart's item array |
| DELETE | `/api/cart` | Clear the cart |
| POST | `/api/cart/merge` | Merge a guest (localStorage) cart in on login |

### Checkout & Payment
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/checkout/session` | Validate stock/coupon, create pending order, init Paystack |
| GET | `/api/checkout/verify` | Confirm payment, deduct stock atomically, send confirmation email |
| POST | `/api/webhooks/paystack` | Backup payment confirmation (server-to-server) |

### Orders
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/orders` | Current user's orders |
| GET | `/api/orders/[id]` | Single order |
| POST | `/api/orders/[id]/cancel` | Cancel + refund + restock + release coupon |

### Wishlist
| Method | Path | Purpose |
|---|---|---|
| GET / POST / DELETE | `/api/wishlist` | List / add / remove |

### Reviews
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/reviews?productId=X` | Approved reviews + the requester's own pending one |
| POST | `/api/reviews` | Submit a review (must have a delivered order for the product) |
| DELETE | `/api/reviews/[id]` | Delete your own review |
| PATCH | `/api/reviews/[id]` | `{ action: 'like' }` — toggle a like |

### Coupons
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/coupons/validate` | Pre-checkout validity check (does not reserve a use) |

### Support / Disputes
| Method | Path | Purpose |
|---|---|---|
| GET / POST | `/api/support` | List / create tickets |
| GET / PATCH | `/api/support/[id]` | Ticket detail / add message |
| GET / POST | `/api/disputes` | List / create disputes |
| GET | `/api/disputes/[id]` | Single dispute |

### Account
| Method | Path | Purpose |
|---|---|---|
| GET / PATCH | `/api/account` | Profile |
| POST | `/api/account/password` | Change/set password |

### Stats & Subscribe
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/stats` | Real homepage metrics |
| POST | `/api/subscribe` | Newsletter signup |

### Admin
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard metrics |
| GET / PATCH | `/api/admin/orders`, `/api/admin/orders/[id]` | Order management |
| GET | `/api/admin/users` | Users + attached order history |
| GET / POST | `/api/admin/categories` | Category CRUD |
| PATCH / DELETE | `/api/admin/categories/[id]` | " |
| GET / POST | `/api/admin/coupons` | Coupon CRUD |
| PATCH / DELETE | `/api/admin/coupons/[id]` | " |
| GET | `/api/admin/support` | All tickets |
| PATCH | `/api/admin/support/[id]` | Reply / manage |
| GET | `/api/admin/disputes` | All disputes |
| PATCH | `/api/admin/disputes/[id]` | Approve/reject + refund |
| GET | `/api/admin/reviews` | All reviews |
| PATCH | `/api/admin/reviews/[id]` | Approve (never unapprove) |
| DELETE | `/api/admin/reviews/[id]` | Delete + email reviewer |

### Misc
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/upload` | Cloudinary image upload |

---

## 10. Key Business Rules & Design Decisions

1. **All inline styles, no Tailwind.** Every component defines a `C` design-token object and uses `style={{}}` directly.
2. **Passwords are plaintext.** An explicit, documented project decision — no bcrypt.
3. **Stock deducts on payment confirmation only**, never on add-to-cart. Re-validated at multiple points: cart load, checkout load, and atomically at the moment of payment confirmation.
4. **Cart item schema is fixed**: `{ productId, name, color, storage, sku, price, quantity, image }`. Every add-to-cart entry point (product detail, products grid, quick-add modal, wishlist, compare) must produce exactly this shape.
5. **Toast notifications only** — never `alert()`/inline error banners. Error toasts read "Heads Up," not "Error" (deliberately softer tone). Confirmations use a custom `ConfirmDialog` (`useConfirm()`), never the browser's native `confirm()`.
6. **Reviews require admin approval** before being visible to anyone but the author, and **cannot be unapproved once approved** — only deleted.
7. **Coupons are single-use per customer**, enforced via an atomic `findOneAndUpdate` with `usedBy: { $ne: userId }` in the same update that increments `usedCount`, preventing a race where two concurrent checkouts both slip through a read-then-write check.
8. **Product deletion is blocked** while any order referencing it hasn't reached a terminal state (`delivered`/`cancelled`/`refunded`).
9. **A discontinued product doesn't just vanish from a cart** — it's kept, shown dimmed with "Sorry, we no longer sell this product," quantity controls disabled, excluded from the total, and must be manually removed before checkout (same treatment as a fully out-of-stock item).
10. **`Product.category` is a free-text string, not a foreign key.** Nothing enforces it staying in sync with the `Category` collection — always use the admin form's category `<select>` when creating products, never hand-type a category string.
11. **`overflow-x: hidden` must never be reapplied to the root `html`/`body`.** Per the CSS spec, that forces the other axis to compute as `auto`, turning `<body>` into its own scroll container and breaking the sticky navbar. Scope any horizontal-scroll fix to a wrapper element instead.
12. **Scroll-reveal sections gated behind async data need a callback ref**, not a one-time `useRef` + `useEffect([])` — a section that mounts after fetched data resolves will otherwise get permanently stuck at `opacity: 0`.
13. **Next.js 16 dynamic params**: API routes use `const { id } = await params`; client pages use `const { id } = use(params)`.
14. **Every page using `useSearchParams()` must be wrapped in `<Suspense>`.**

---

## 11. Cart System (Deep Dive)

The cart mirrors the wishlist's guest/account-merge pattern, implemented in `lib/cart.js`:

```js
const GUEST_KEY = 'techmart-cart';

export async function getCart(status) {
  if (status === 'authenticated') {
    const res = await fetch('/api/cart');
    const data = await res.json();
    return data.items || [];
  }
  return getGuestCart(); // reads GUEST_KEY from localStorage
}

export async function saveCart(items, status) {
  if (status === 'authenticated') {
    await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
  } else {
    setGuestCart(items);
  }
  window.dispatchEvent(new Event('cart-updated'));
}
```

Every page that touches the cart (`cart/page.jsx`, `checkout/page.jsx`, `products/page.jsx`, `products/[id]/page.jsx`, `wishlist/page.jsx`, `compare/page.jsx`) goes through `getCart`/`saveCart` rather than touching `localStorage` or `/api/cart` directly, so the guest/authenticated branching lives in exactly one place.

**Merge on login** (in `Navbar.jsx`, fires once when `status` becomes `'authenticated'`):

```js
useEffect(() => {
  if (status === 'authenticated') {
    const guestItems = getGuestCart();
    if (guestItems.length > 0) {
      fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: guestItems }),
      }).then(() => {
        clearGuestCart();
        window.dispatchEvent(new Event('cart-updated'));
      });
    }
  }
}, [status]);
```

The merge endpoint combines quantities for matching SKUs and appends everything else — see `app/api/cart/merge/route.js`.

**Discontinued-item detection** (cart page): after fetching live product data, any cart line whose SKU no longer appears anywhere in the catalog (not just "stock is 0," but genuinely gone) is flagged `isDiscontinued` and rendered dimmed/grayscaled with a "Sorry, we no longer sell this product" badge, distinct from the "Out of Stock" badge used for a SKU that still exists but has zero stock.

---

## 12. Payment & Stock Integrity (Deep Dive)

The riskiest moment in the whole system is the gap between "customer starts checkout" and "customer's payment is confirmed" — stock is only *checked*, not *reserved*, when the Paystack session is created, so two customers can both pass that check for the last unit of something.

`lib/orderFulfillment.js` closes that gap atomically at the moment payment is actually confirmed:

```js
export async function fulfillOrRefund(order, customerEmail) {
  const decremented = [];
  let oversold = false;

  for (const item of order.items) {
    const result = await Product.updateOne(
      { _id: item.productId, variants: { $elemMatch: { sku: item.sku, stock: { $gte: item.quantity } } } },
      { $inc: { 'variants.$[v].stock': -item.quantity } },
      { arrayFilters: [{ 'v.sku': item.sku }] }
    );
    if (result.modifiedCount > 0) decremented.push(item);
    else oversold = true;
  }

  if (!oversold) return { fulfilled: true };

  // Roll back whatever succeeded, refund via Paystack, cancel the order, email the customer.
  for (const item of decremented) {
    await Product.updateOne(
      { _id: item.productId, 'variants.sku': item.sku },
      { $inc: { 'variants.$.stock': item.quantity } }
    );
  }
  // ... Paystack refund call, Refund.create(), Order status → 'cancelled', email
  return { fulfilled: false };
}
```

The MongoDB update only succeeds if `stock >= quantity` **at that exact instant** — this is what actually prevents overselling, not the earlier UI-level check. If any single item in a multi-item order can't be fulfilled, the *whole order* is rolled back and refunded rather than partially shipped.

This function is called identically from both `GET /api/checkout/verify` (the client-driven confirmation after Paystack redirects back) and `POST /api/webhooks/paystack` (the server-to-server backup). An outer guard — `Order.findOneAndUpdate({ status: 'pending', paymentVerifiedAt: { $exists: false } }, { $set: { paymentVerifiedAt: new Date() } })` — ensures only one of the two code paths ever actually runs the fulfillment logic per order, so there's no risk of double-refunding or double-deducting if both fire.

---

## 13. Coupon System (Deep Dive)

```js
const coupon = await Coupon.findOneAndUpdate(
  {
    code: couponCode.toUpperCase(),
    isActive: true,
    expiresAt: { $gt: new Date() },
    $expr: { $lt: ['$usedCount', '$maxUses'] },
    usedBy: { $ne: session.user.id },
  },
  { $inc: { usedCount: 1 }, $push: { usedBy: session.user.id } },
  { new: true }
);
```

This single atomic operation enforces three things at once: the coupon hasn't expired, it hasn't hit its global usage cap, and *this specific user* hasn't used it before. If it returns `null`, a best-effort follow-up read distinguishes *why* for the error message ("You have already used this coupon" vs. "This coupon has reached its usage limit" vs. a generic invalid/expired message) — that follow-up read is not itself safety-critical, only cosmetic, since the atomic update above is what actually prevents double-redemption under a race.

If the Paystack session never gets created (e.g. Paystack API error), the reservation is released:

```js
await Coupon.findOneAndUpdate(
  { code: validatedCouponCode },
  { $inc: { usedCount: -1 }, $pull: { usedBy: session.user.id } }
);
```

The same release logic runs when an order is later **cancelled** by the customer or **refunded** via an approved dispute — a customer who doesn't end up keeping the discount gets their one-time use back.

---

## 14. Email System

Sent via Resend from `noreply@techmartng.store`:

- OTP emails (registration, password reset, 2FA)
- Order confirmation, status-change, and cancellation emails
- Dispute resolution emails (approved w/ refund amount, or rejected)
- Review-deleted notification
- Newsletter welcome email

**Free-tier limitation:** Resend's free tier only delivers to the account owner's own verified email address — full inbox delivery to arbitrary customers requires domain verification.

**Link generation rule:** transactional/marketing email links that should always point at the live storefront (e.g. the "Create Your Account" link in the subscribe welcome email) use a hardcoded `SITE_URL` constant, **not** `process.env.NEXTAUTH_URL` — the latter is correctly environment-specific (needed for OAuth callbacks) and would otherwise embed `localhost` into emails sent from a local dev server.

---

## 15. Environment Variables

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://techmart-zeta.vercel.app   # localhost locally, live domain on Vercel
RESEND_API_KEY=re_...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhuvwpfa4
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

`NEXTAUTH_URL` on Vercel **must** be the live domain — not localhost — and requires a redeploy after being changed for the new value to take effect. The checkout callback URL is derived from the incoming request's host header rather than `NEXTAUTH_URL`, specifically to avoid this class of bug on the payment path.

---

## 16. Local Development

```bash
git clone https://github.com/Salim12344/techmart.git
cd techmart
npm install
# Create .env.local with the variables listed in §15
npm run dev
```

**Local dev uses the same live MongoDB Atlas database as production** — there is no separate dev database. Be careful with any destructive script or bulk operation.

Always run a full production build before considering a change done:

```bash
npx next build
```

`npm run dev` (Turbopack, dev mode) is more forgiving than a production build and can hide real errors that only surface at build time.

### Adding products

Use the admin panel (`/admin/products`) and its category `<select>` — never hand-write a `category` string on a product, or you'll reintroduce a mismatch with the `Category` collection (see §10, rule 10).

---

## 17. Deployment

- **Vercel** auto-deploys from the `master` branch on every push.
- **MongoDB Atlas** free tier auto-pauses after inactivity and must be resumed manually from the Atlas dashboard.
- **IP allowlist**: `0.0.0.0/0` must be added in Atlas Network Access for Vercel's dynamic serverless IPs to connect.
- **Paystack webhook** URL: `https://techmart-zeta.vercel.app/api/webhooks/paystack`.
- **Google OAuth redirect URI**: `https://techmart-zeta.vercel.app/api/auth/callback/google`.
- Environment variable changes on Vercel require a **redeploy** to take effect — they are not picked up live.

---

## 18. Known Issues & Future Work

**Not yet built:**
- Search auto-suggest dropdown
- In-app notification bell for order updates
- Product image gallery/carousel on the detail page (currently one main image + per-color images, no multi-photo carousel)
- Shipping tracking numbers
- Admin analytics charts (dashboard has real numbers, no visual charts)
- Dark/light theme toggle
- Recently-viewed products

**Testing:** there are no automated tests in this repository. Verification has historically been done via `npx next build` (type/compile correctness) plus manual smoke-testing, occasionally assisted by an ad hoc Playwright install (`npm install --no-save playwright && npx playwright install chromium`) — Playwright is not a persistent dependency.

**Historical fixes worth knowing about** (in case similar symptoms resurface):
- A recurring Windows DNS flake on external calls, mitigated by `instrumentation.js` pinning DNS servers — if MongoDB/Cloudinary calls suddenly start failing locally, this is the known cause, not necessarily a new regression.
- Stray `node.exe` processes piling up over a very long dev session have previously broken API routes (either as a 500 HTML page instead of JSON, or as spurious 401s on routes that should be authorized) — the fix is killing all `node.exe` processes and restarting `npm run dev` clean.
