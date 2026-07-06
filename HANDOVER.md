# TechMart — Project Handover Document
**Last Updated:** July 6, 2026
**Repository:** https://github.com/Salim12344/techmart
**Live Site:** https://techmart-zeta.vercel.app
**Developer Email:** salimaliyuu00@gmail.com

---

## 0. START HERE — Read This First In A New Chat

This file is meant to be uploaded/pasted into a fresh chat so an assistant can pick up
work with full context, without re-deriving everything from scratch. Read section 1-9
for the stable project shape, then **section 17-19 for what changed most recently** and
what's still open — that's the part most likely to matter for whatever you're asked to
do next.

Quick orientation:
- Local dev: `npm run dev`, uses the **same live MongoDB Atlas database** as production
  (no separate dev DB) — be careful with destructive scripts.
- Full build check before calling anything done: `npx next build` (not just `npm run dev`
  compiling fine — dev mode tolerates things build mode won't).
- This project has had a recurring **Windows DNS resolution flake** (`ESERVFAIL`/
  `EAI_AGAIN` on external calls — MongoDB SRV lookup, Cloudinary uploads, etc.) on this
  specific dev machine. It's mitigated by `instrumentation.js` (pins DNS servers to
  8.8.8.8/1.1.1.1 for the whole Next.js server process) but if it resurfaces, that's the
  known cause — don't assume it's a new code bug.
- Multiple background `node.exe` processes tend to pile up in long sessions on this
  machine and can crash the dev server's compile worker (shows as a 500 HTML page
  instead of JSON on any API route, e.g. `/api/auth/session`). Fix: kill stray `node.exe`
  processes and restart `npm run dev` clean.

---

## 1. Project Overview

TechMart is a full-stack e-commerce platform for Apple products built with **Next.js 16** (App Router), **MongoDB Atlas**, **NextAuth v4**, **Paystack** for payments, **Resend** for emails, and **Cloudinary** for image uploads. The UI uses **inline styles only** (no Tailwind — custom tokens were broken) with **lucide-react** icons. Currency is **Nigerian Naira (₦)**.

---

## 2. Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Frontend + API routes |
| MongoDB Atlas + Mongoose | Database |
| NextAuth v4 (JWT strategy) | Authentication (Credentials + Google OAuth) |
| Paystack | Payment processing (NGN) |
| Resend | Transactional emails |
| Cloudinary | Image uploads |
| Lucide React | Icons |
| `motion` (framer-motion) | Scroll-reveal / stagger / feedback animations (added this session) |
| Vercel | Hosting/Deployment |

---

## 3. Project Structure

### Route Groups
- `app/(store)/` — Customer-facing pages (wrapped with Navbar + Footer + BackToTop)
- `app/admin/` — Admin panel (sidebar layout, role-gated)
- `app/auth/` — Authentication pages (login, register, OTP, etc.)
- `app/api/` — All API routes

### Key Directories
```
models/           — Mongoose schemas (user, product, order, etc.)
lib/              — Shared utilities (db.js, email.js, otp.js, formatPrice.js)
app/components/   — Shared components (Navbar, Footer, Toast, BackToTop, Button, ConfirmDialog)
scripts/          — Seed scripts (seed-products.js) — this dir is also used for
                    one-off migration scripts; DELETE them after running, don't commit
instrumentation.js — Runs once on server boot; pins DNS servers (see section 0)
```

---

## 4. All Pages Built

### Customer Pages (under `app/(store)/`)
| Page | Path | Description |
|---|---|---|
| Homepage | `/` | Dark hero, product slider, featured products, stats, categories, subscribe |
| Products | `/products` | Listing with search, category filters, sort, wishlist, compare, cart toggle |
| Product Detail | `/products/[id]` | Full detail with color/storage selectors, reviews, add to cart, wishlist |
| Cart | `/cart` | "Your Bag" with quantity controls, remove, order summary |
| Checkout | `/checkout` | Shipping form + Paystack payment integration |
| Checkout Success | `/checkout/success` | Payment verification, order confirmed animation |
| Orders | `/orders` | Order history list, paginated 5/page, status badges |
| Order Detail | `/orders/[id]` | Full order detail with progress tracker, timestamps, expected delivery |
| Wishlist | `/wishlist` | Saved products with add-to-cart and remove |
| Account | `/account` | Profile edit, password change/set, quick links |
| Support | `/support` | Create/list support tickets, call-us `tel:` link |
| Support Chat | `/support/[id]` | Chat-style conversation with 30s polling |
| Compare | `/compare` | Side-by-side product comparison (same category, max 3) |
| FAQ | `/faq` | Accordion FAQ with categories, back button |
| Disputes | `/disputes` | Customer dispute list |

### Auth Pages (under `app/auth/`)
| Page | Path |
|---|---|
| Login | `/auth/login` |
| Register | `/auth/register` (with OTP verification) |
| Forgot Password | `/auth/forgot-password` (now has back-to-login link) |
| Reset Password | `/auth/reset-password` |
| Verify OTP | `/auth/verify-otp` |
| Verify 2FA | `/auth/verify-2fa` |

### Admin Pages (under `app/admin/`)
| Page | Path | Description |
|---|---|---|
| Dashboard | `/admin` | Stats overview, recent orders |
| Products & Categories | `/admin/products` | CRUD products with variants, specs, per-color images |
| Orders | `/admin/orders` | Manage orders, change status; detail panel now renders inline under the selected row on mobile instead of at the bottom of the page |
| Users | `/admin/users` | View registered users **with real order counts/history** (was broken, fixed this session) |
| Coupons | `/admin/coupons` | Coupon CRUD |
| Support | `/admin/support` | Manage support tickets, reply to customers |
| Disputes | `/admin/disputes` | Review disputes, approve refunds via Paystack |
| Reviews | `/admin/reviews` | **Moderation queue** — Pending/Approved/All filter tabs, Approve/Unapprove + Delete |

---

## 5. API Routes

### Auth
- `POST /api/auth/register` — Register with OTP verification
- `POST /api/auth/send-otp` — Send OTP email
- `POST /api/auth/verify-otp` — Verify OTP
- `POST /api/auth/forgot-password` — Initiate password reset
- `POST /api/auth/reset-password` — Reset password with OTP
- `POST /api/auth/verify-2fa` — Two-factor authentication
- `POST /api/auth/resend-otp` — Resend OTP
- `GET/POST /api/auth/[...nextauth]` — NextAuth handler

### Products
- `GET /api/products` — List all products
- `POST /api/products` — Create product (admin)
- `GET/PATCH/DELETE /api/products/[id]` — Single product CRUD
- `POST /api/upload` — Cloudinary image upload

### Orders
- `GET /api/orders` — User's orders
- `POST /api/orders` — Create order
- `GET/PATCH /api/orders/[id]` — Single order
- `POST /api/orders/[id]/cancel` — Cancel + refund + restock (sets `cancelledAt`)

### Checkout & Payment
- `POST /api/checkout/session` — Create Paystack checkout session
- `GET /api/checkout/verify` — Verify payment + deduct stock + send email; **marks the
  order `cancelled` if Paystack reports the payment as not-successful** (was left
  `pending` forever before)
- `POST /api/webhooks/paystack` — Paystack webhook (backup payment confirmation)

### Wishlist
- `GET /api/wishlist` — Get user's wishlist
- `POST /api/wishlist` — Add to wishlist
- `DELETE /api/wishlist` — Remove from wishlist

### Reviews
- `GET /api/reviews?productId=X` — Get product reviews. **Now filters to `isApproved:
  true`, plus the requesting user's own pending review(s) if logged in.**
- `POST /api/reviews` — Submit review (must have purchased + delivered). Saves as
  **unapproved by default** — invisible to others until an admin approves it.
- `DELETE /api/reviews/[id]` — **NEW.** A user deletes their own review (403 if not the
  owner). Recalculates product rating from remaining approved reviews.
- `PATCH /api/reviews/[id]` — **NEW.** `{ action: 'like' }` toggles a like from another
  user (403 if you try to like your own review).

### Support
- `GET/POST /api/support` — List/create support tickets
- `GET/PATCH /api/support/[id]` — Single ticket + add message

### Disputes
- `GET/POST /api/disputes` — List/create disputes
- `GET /api/disputes/[id]` — Single dispute

### Account
- `GET/PATCH /api/account` — Get/update profile
- `POST /api/account/password` — Change/set password

### Subscribe
- `POST /api/subscribe` — Email subscription (checks if existing customer)

### Stats
- `GET /api/stats` — Real database metrics (products, users, orders, satisfaction)

### Admin Routes
- `GET /api/admin/stats` — Admin dashboard stats
- `GET /api/admin/orders` — All orders
- `PATCH /api/admin/orders/[id]` — Update order status (auto-sets timestamps, sends email)
- `GET /api/admin/users` — All users. **Now attaches each user's actual `orders` array**
  (fetched separately and mapped by `userId` — the User model has no `orders` field of
  its own, so this was always required and was previously missing).
- `GET/POST /api/admin/categories` — Categories CRUD
- `GET/PATCH/DELETE /api/admin/categories/[id]` — Single category
- `GET /api/admin/coupons`, `PATCH/DELETE /api/admin/coupons/[id]` — Coupon management
- `GET /api/admin/support` — All support tickets
- `PATCH /api/admin/support/[id]` — Reply/manage ticket
- `GET /api/admin/disputes` — All disputes
- `PATCH /api/admin/disputes/[id]` — Approve/reject dispute (Paystack refund on approve)
- `GET /api/admin/reviews` — All reviews (approved and pending)
- `PATCH /api/admin/reviews/[id]` — **NEW.** `{ isApproved: true|false }` — approve or
  unapprove a review, recalculates product rating from approved reviews only
- `DELETE /api/admin/reviews/[id]` — Delete review (sends email, recalculates rating
  from approved reviews only)

---

## 6. Database Models

| Model | File | Registered As | Key Fields |
|---|---|---|---|
| User | `models/user.js` | `'User'` | name, email, password (plain text), role, phone |
| Product | `models/product.js` | `'product'` | name, category, image, colors [{name, hex, image}], variants [{color, storage, sku, price, stock}], specs, averageRating, reviewCount |
| Order | `models/order.js` | `'order'` | orderNumber, userId, items, shippingAddress, status, totalAmount, confirmedAt, shippedAt, deliveredAt, **cancelledAt** |
| Category | `models/category.js` | `'Category'` | name, slug, specFields |
| Review | `models/Review.js` | `'Review'` | productId, userId, orderId, rating, comment, **isApproved** (default false), **likes: [ObjectId ref User]** |
| Wishlist | `models/Wishlist.js` | `'Wishlist'` | userId, productId |
| OTPToken | `models/OTPToken.js` | `'OTPToken'` | email, otpHash, purpose, expiresAt |
| SupportTicket | `models/SupportTicket.js` | `'SupportTicket'` | userId, subject, category, messages[], status, priority, userLastReadAt |
| Dispute | `models/Dispute.js` | `'Dispute'` | orderId, userId, reason, description, status, adminNote |
| Refund | `models/Refund.js` | `'Refund'` | disputeId, orderId, amount, status, paystackRefundId |
| Subscriber | `models/Subscriber.js` | `'Subscriber'` | email |
| Coupon | `models/Coupon.js` | `'Coupon'` | code, discountPercent, expiresAt, maxUses, usedCount, isActive — fully wired up now |

**IMPORTANT:** Model `ref` names must match registered names exactly. Known pattern:
- User = `'User'` (capital)
- Product = `'product'` (lowercase)
- Order = `'order'` (lowercase)

**Category data integrity note:** `Product.category` is a free-text string, not a
foreign key — nothing stops it from drifting out of sync with the `Category`
collection. This actually happened (products used `iPhone`/`iPad`/`Apple TV`/etc. while
only 3 miscased Category docs existed — `Ipad`, `TV`, `iphone`). Fixed via one-off
migration (renamed + created missing categories), but if you add products via a route
that doesn't go through the admin form's category `<select>`, you can reintroduce this.

---

## 7. Environment Variables

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://techmart-zeta.vercel.app  # MUST be live URL on Vercel, localhost locally
RESEND_API_KEY=re_...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhuvwpfa4
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Note:** `NEXTAUTH_URL` on Vercel must be the live domain, not localhost. The checkout callback URL is derived from the request host (not NEXTAUTH_URL) to avoid redirect issues.

---

## 8. Key Design Decisions & Rules

1. **All inline styles** — No Tailwind. Tailwind custom tokens were broken. Every component uses inline `style={{}}` objects.
2. **Passwords are plain text** — Intentional project decision. No bcrypt.
3. **Apple Design Tokens** — Consistent color palette (`C` object) in every file.
4. **Fonts** — Mona Sans + Instrument Serif loaded via Google Fonts in root layout.
5. **Toast notifications** — Via `useToast()` from `@/app/components/Toast`. Never inline error banners. Error toasts read **"Heads Up"**, not "Error" (softer tone, deliberate choice). Toast queue caps at **2 visible at once** — a burst of validation errors won't flood the screen.
6. **Confirmation dialogs** — On all destructive actions (delete, sign out, remove). Uses a **custom `ConfirmDialog`** (`app/components/ConfirmDialog.jsx`, `useConfirm()` hook) — **never use the raw browser `confirm()`/`prompt()`**, that was fully replaced this session.
7. **Stock deducts on payment only** — Not on add to cart. Validated at checkout (cart page AND checkout page both re-check live stock now), deducted after Paystack confirms.
8. **Cart item schema — must match exactly**: `{ productId, name, color, storage, sku, price, quantity, image }`. There were multiple independent `addToCart` implementations (product detail page, products grid, quick-add modal, wishlist, compare page) that had drifted — Compare page's used `productName`/`unitPrice` instead of `name`/`price`, causing NaN totals and missing image alt text for anything added via Compare. **If you add another add-to-cart entry point, copy the exact field names from `app/(store)/cart/page.jsx`.**
9. **Cart quantity UX is the traditional model** — on the product detail page, the quantity stepper is a "how many to add" selector, capped by remaining stock room (`stock - already in bag`), independent of what's already in the cart. The "Add to Cart" button always says exactly that and adds the selected quantity on top. It does **not** directly rewrite the existing cart line — that was tried and reverted per explicit user feedback.
10. **Email sender** — `noreply@techmartng.store` (requires Resend domain verification for non-test delivery).
11. **Next.js 16 params** — API routes: `const { id } = await params`. Client pages: `const { id } = use(params)`.
12. **Suspense required** — All pages using `useSearchParams()` must wrap content in `<Suspense>`.
13. **Mobile responsive** — All pages use className hooks + `<style>` tag media queries at 768px.
14. **Compare** — Max 3 products, same category only.
15. **Low stock threshold** — 5 units per variant.
16. **Reviews require admin approval** — new reviews save with `isApproved: false` and are invisible to the public/other shoppers (and excluded from the product's average rating) until approved from `/admin/reviews`. The review's own author can still see it (marked "Pending approval") and delete it themselves.
17. **`overflow-x` on `html`/`body` breaks `position: sticky`** — don't add `overflow-x: hidden` back to the root html/body. Per the CSS spec, that forces the other axis's overflow to compute as `auto`, which turns `<body>` into its own scroll container and breaks sticky positioning for the nav. If a horizontal-scroll bug shows up again, scope the fix to a wrapper (e.g. `.store-main`) that does **not** contain the sticky `<Navbar>`, which is a sibling of `<main>` in `app/(store)/layout.jsx`, not a child.
18. **Scroll-reveal sections that depend on async data need a callback ref, not `useRef`** — `useScrollReveal()` in the homepage originally used `useRef` + a one-time `useEffect([])`. Any section gated behind async state (e.g. `{categories.length > 0 && <section ref={...}>}`) could mount *after* that effect already ran and found `ref.current === null`, permanently stuck at `opacity: 0`. Fixed with a callback-ref pattern that re-fires whenever the node actually mounts. Keep this pattern for any future scroll-reveal section that's conditionally rendered on fetched data.

---

## 9. Email System

All emails sent via Resend from `noreply@techmartng.store`:
- **OTP emails** — Registration, password reset, 2FA
- **Order confirmation** — Includes item details, total, delivery window
- **Order status changes** — Confirmed, shipped, delivered
- **Dispute resolution** — Approved (with refund amount) or rejected
- **Review deleted** — Notification with reason
- **Subscribe welcome** — For new non-customer subscribers
- **Order cancellation** — Sent from the cancel-order route

**Limitation:** Free Resend tier only sends to the account owner's email. Need custom domain verification for production.

---

## 10. Payment Flow (Paystack)

1. Customer fills checkout form → clicks "Pay Now"
2. `POST /api/checkout/session` validates stock, creates pending order, initializes Paystack transaction
3. Customer redirected to Paystack hosted payment page (full-page redirect, not the inline popup SDK)
4. After payment → redirected to `/checkout/success?reference=TM-...`
5. Success page calls `GET /api/checkout/verify?reference=TM-...` **before** touching the cart
6. Verify endpoint: confirms with Paystack API, updates order to 'confirmed', deducts stock, sends email — **only then** does the success page clear the cart. If verification fails (payment cancelled/abandoned), the order is marked `cancelled` server-side and the cart is left intact so the customer can retry
7. Webhook (`POST /api/webhooks/paystack`) also handles confirmation as backup
8. If the customer hits **Back** after cancelling on Paystack's page, the checkout page detects the bfcache restore (`pageshow` event, `event.persisted`) and resets the stuck "redirecting..." button state — previously it stayed frozen mid-submit forever

**Test card:** `4084 0840 8408 4081`, any future expiry, any CVV.

---

## 11. What Worked Well

- Paystack payment integration (after fixing env var issues)
- Google OAuth with automatic user creation
- Support ticket system with polling for real-time feel
- Wishlist toggle with heart state tracking
- Compare system with same-category enforcement
- Product variant system (color × storage matrix)
- Admin sidebar with mobile hamburger overlay
- Real database stats (no fake numbers)
- Order stage timestamps (confirmedAt, shippedAt, deliveredAt, cancelledAt)
- Per-color product images
- Review moderation queue (pending/approved/all filters)

---

## 12. Known Issues & Things That Needed Fixing (Historical)

| Issue | Root Cause | Fix Applied |
|---|---|---|
| Duplicate layout files (layout.js + layout.jsx) | Next.js picks wrong one | Deleted layout.js |
| "Schema not registered" errors | Model ref name mismatches (e.g., 'Order' vs 'order') | Fixed all refs to match registered names |
| Google users getting numeric ID | JWT callback not resolving MongoDB ObjectId | Added ObjectId validation + DB lookup on every JWT refresh |
| Admin login goes to homepage | Session not ready after signIn | Added retry loop (5 attempts, 400ms delay) |
| Toast appearing twice | Double ToastProvider (root + store layout) | Removed from store layout |
| Payment redirect to localhost | NEXTAUTH_URL set to localhost on Vercel | Changed to derive URL from request host |
| Paystack "Invalid key" on Vercel | Env vars not saved/redeployed properly | Had to delete and re-add env vars, then redeploy |
| Products not showing | MongoDB Atlas cluster paused or IP not whitelisted | Resume cluster, add 0.0.0.0/0 to Network Access |
| useSearchParams build error | Next.js can't prerender pages with useSearchParams | Wrapped all 6 pages with `<Suspense>` |

See section 17 for issues found and fixed in the most recent work session.

---

## 13. What's NOT Built Yet (Future Work)

- **Search auto-suggest** — Search works but no dropdown suggestions
- **Notification bell** — In-app notifications for order updates
- **Product image gallery/carousel** — One main image + per-color images, no carousel on detail page
- **Shipping tracking** — No tracking number field
- **Admin analytics charts** — Dashboard has numbers but no visual charts
- **Dark/light theme toggle** — Currently fixed light theme (was briefly dark, reverted)
- **Recently viewed products** — Not implemented
- **Remaining per-color product photos** — see section 18, several color variants (Pink,
  Teal, Purple, Rose Gold, Orange, Jet Black) still fall back to the category default
  image rather than a color-accurate photo
- **Test/junk product cleanup** — a product literally named "asasdsds" with nonsense
  color names is still live in the catalog (seed/test data); flagged but not removed —
  ask the user before deleting since it's their data

---

## 14. Deployment Notes

- **Vercel** auto-deploys from `master` branch on push
- **MongoDB Atlas** — Free tier auto-pauses after inactivity. Must resume manually. **This is the one live database — local dev talks to production data, there is no separate dev DB.**
- **IP Whitelist** — Must add `0.0.0.0/0` in MongoDB Network Access for Vercel's dynamic IPs
- **Paystack Webhook** — Set to `https://techmart-zeta.vercel.app/api/webhooks/paystack`
- **Google OAuth Redirect** — `https://techmart-zeta.vercel.app/api/auth/callback/google`
- After adding env vars on Vercel, must **redeploy** for them to take effect

---

## 15. How to Continue Development

### Local Setup
```bash
git clone https://github.com/Salim12344/techmart.git
cd techmart
npm install
# Create .env.local with all env vars listed in Section 7
npm run dev
```

### Adding Products
```bash
node scripts/seed-products.js
```
Then upload images via admin panel at `/admin/products` — **use the category dropdown
as provided**, don't hand-write a category string, or you'll reintroduce the
category/product data mismatch described in section 6.

### Key Patterns to Follow
- Use the `C` object for colors in every file
- Use `useToast()` for notifications, never `alert()` or inline errors
- Use `useConfirm()` (`app/components/ConfirmDialog.jsx`) for destructive-action
  confirmations — **never** the raw browser `confirm()`/`prompt()`
- All API routes: `import { connectDB } from '@/lib/db'`
- Dynamic params: `await params` in API, `use(params)` in client pages
- Always import models that will be populated (e.g., import User when populating userId)
- Currency formatting: `import { formatPrice } from '@/lib/formatPrice'` — don't roll
  your own `.toLocaleString()` call, that's exactly the inconsistency that got cleaned
  up this session
- Test on mobile — all grids must stack, all layouts must be responsive
- Run `npx next build` before considering a change done — dev mode (`npm run dev`) is
  more forgiving and can hide real errors that only surface at build time

---

## 16. Git History Summary

Recent commits (most recent first):
1. `2bdee1d` — order/review admin bugs, review moderation+likes, checkout cart-schema bug, nav polish
2. `d0da709` — cart/checkout/mobile bugs, a11y + confirm dialog cleanup, add motion animations
3. `c8853a6` — 7 audit findings - refund amounts, race conditions, role staleness
4. `ede5d18` — Guest wishlist with account merge on login, clear storage on signout
5. `f9e82a3` — Reset quick-add quantity to 1 when switching color or storage
6. `867c1e3` — Cart logic overhaul, stock caps everywhere, atomic coupons, admin status guards

Earlier milestones:
- `086785f` — Initial complete platform (auth, pages, admin, all features)
- `d737f01` — Full mobile responsiveness
- `83089a3` — Support ticket system, wishlist toggle, order emails
- `b173aab` — Dispute/refund system, admin reviews, stock validation
- `1d190b8` — Premium homepage with slider, subscribe, animations
- `9cc52e4` — Final consistency fixes (stock, cart toggle, back buttons)

---

## 17. Most Recent Session — Detailed Log

This was a long, bug-fix-and-polish-heavy session (not new features from scratch).
Roughly in the order they came up:

**Cart / checkout correctness**
- Product detail page's quantity stepper directly rewrote the live cart quantity when
  an item was already in the bag, but the separate "Add Another" button used a stale
  local `quantity` value — clicking it after reducing quantity would silently jump the
  cart back up. Reverted to the traditional model (see rule #9 in section 8).
- Checkout page didn't re-check live stock before charging — added the same
  stock-clamp check the cart page already had.
- Cancelling on Paystack and clicking Back left the checkout page frozen on
  "redirecting..." forever (bfcache restore issue) — fixed with a `pageshow` listener.
- Cancelling on Paystack also used to silently clear the cart even though nothing was
  charged — fixed to only clear on verified success, and to mark the order `cancelled`
  server-side instead of leaving it `pending` forever.
- Compare page's own `addToCart` used a different item schema (`productName`/
  `unitPrice`) than everywhere else (`name`/`price`) — caused NaN totals and missing
  image alt text for anything added via Compare. Brought in line with the standard
  schema, added stock capping and the missing `cart-updated` event dispatch.
- Cart/quick-add "add to cart" flows were using the generic product image instead of
  the selected color's image — fixed across product detail page, products grid,
  quick-add modal, and wishlist.

**Mobile / layout bugs**
- Missing `<meta viewport>` tag was causing mobile browsers to render at a
  desktop-width viewport and scale down — this was the real cause of "gap on the side"
  and "site scrolls left and right" reports, not a CSS overflow issue as first assumed.
- Back-to-top button was hidden behind the mobile bottom tab bar — added a
  mobile-only offset.
- Admin order detail panel rendered *after* the entire order list on mobile instead of
  next to the tapped row — extracted the detail JSX into a shared render function so it
  can render inline under the row on mobile and in the sticky sidebar on desktop.
- Desktop nav stopped sticking to the top while scrolling — caused by an earlier fix
  (`overflow-x: hidden` on `html`/`body`) that had the spec-mandated side effect of
  forcing `overflow-y: auto`, turning `<body>` into its own scroll container. See rule
  #17 in section 8 for the permanent fix and what not to redo.
- Homepage Categories section tiles were permanently invisible (`opacity: 0`) — a
  scroll-reveal `IntersectionObserver` ref-timing bug, see rule #18 in section 8.

**Admin panel**
- `/admin/users` never showed a user's actual orders (API never attached them) — fixed.
- Removed the "2FA enabled" field from the admin user detail panel (not a real feature
  in this app, was showing a meaningless value).
- `/admin/products` category dropdown only ever offered 3 (miscased) categories while
  products actually used 8 different category names — see section 6 for the fix.
- Image upload was failing with a Cloudinary DNS error — see section 0 / the
  `instrumentation.js` fix.

**Reviews — new moderation + social features**
- Reviews now require admin approval before they're visible to anyone but their author
  (`isApproved`, defaults false). Product rating/count only reflect approved reviews.
- Users can delete their own review (new `DELETE /api/reviews/[id]`).
- Users can like other users' reviews, not their own (new `PATCH /api/reviews/[id]`
  with `{ action: 'like' }`, `likes` array on the Review model).
- `/admin/reviews` got Pending/Approved/All filter tabs and an Approve/Unapprove
  button next to the existing Delete.

**Orders**
- Customer `/orders` list now paginates 5-per-page.
- Cancelled orders were showing as "Pending" on the orders list — the list page's
  status-badge config had no `cancelled`/`refunded` entry and silently fell back to
  `pending`. Fixed, and both list + detail pages now show the actual cancellation date.
- Orders (list + detail) now show an "Expected Delivery" date range (3–7 days from
  confirmation, matching the confirmation email's wording) while the order is active.

**UI polish / cleanup**
- Replaced every `window.confirm()`/`prompt()` in the app with a custom styled
  `ConfirmDialog` (`app/components/ConfirmDialog.jsx`, `useConfirm()` hook).
- Centralized currency formatting into `lib/formatPrice.js` (was inconsistent —
  bare `.toLocaleString()` in some places vs `.toLocaleString('en-NG')` in others; also
  fixed a real bug where "Free" delivery showed as "₦0" in one admin view).
- Toast copy softened ("Heads Up" instead of "Error"; generic messages reworded to
  sound less like a stack trace), and the toast queue now caps at 2 visible at once.
- Added `motion` (framer-motion) animations: homepage hero entrance, product grid
  stagger-in on scroll, add-to-cart button success feedback, cart item remove
  transition.
- Added a11y basics: `aria-label`s on icon-only buttons, `aria-invalid`/
  `aria-describedby` linking checkout field errors to their inputs.
- Whitespace trimming added to register/support/account form submissions.
- Added a `tel:` call link to the Support page.
- FAQ page got a back button (`router.back()`).
- Removed the redundant search icon from the desktop nav (Products page already has
  its own search bar).
- Replaced most placeholder/stock product images with real (freely-licensed) device
  photos, per category and for the most common colors — see section 18 for exactly
  what's still using a generic fallback.

---

## 18. Product Images — Current State

Real photos (sourced from Unsplash, free license) were uploaded to Cloudinary and
applied by category, then further refined per-color where a real match was found:

- **Fully covered by real per-color photos:** iPhone 16 / 16 Pro / 16 Pro Max / iPhone 8
  (all colors), MacBook Air 15" (all 4 colors), MacBook Pro 14" (both colors)
- **Partially covered:** iPad Air/Pro, Apple Watch Series 10/Ultra 2, AirPods Max — some
  colors (Space Gray, Starlight, Silver, Midnight) got real matches since they share a
  name with a sourced phone/laptop photo; **Purple, Blue, Jet Black, Rose Gold, Orange**
  still fall back to the category-level default image
- If asked to finish this: source real photos for those remaining colors (Unsplash
  search + `WebFetch` to pull the direct `images.unsplash.com` URL, download, POST to
  `/api/upload` for a Cloudinary URL, then update `Product.colors[].image` for the
  matching color name via a script — see git history around commit `2bdee1d` for the
  exact pattern used, since the actual migration scripts were deleted after running,
  per the "don't commit one-off scripts" rule in section 3)

---

## 19. Things To Watch / Ask The User About

- The Compare page bug (section 8, rule #8) means any cart added *before* this fix,
  still sitting in a real browser's `localStorage`, will keep showing NaN until that
  specific item is removed and re-added. This can't be fixed server-side — it's
  client-side storage. If a user reports a NaN price, ask them to remove and re-add
  that item.
- The "asasdsds" test product (section 13) is still live — confirm with the user before
  deleting, it might be intentional test data they still need.
- Homepage centering — the user reported something looked off-center at one point but
  never followed up with the promised screenshot. Worth asking if it's still an issue.
- No automated tests exist in this repo. All verification in this session was done via
  `npx next build` (type/compile check) plus manual Playwright-driven smoke checks
  (installed ad hoc, not a permanent dependency — `playwright` is not in
  `package.json`). If you need to visually verify something, you'll need to install it
  fresh (`npm install --no-save playwright && npx playwright install chromium`).
