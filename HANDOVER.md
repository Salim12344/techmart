# TechMart — Project Handover Document
**Last Updated:** June 27, 2026  
**Repository:** https://github.com/Salim12344/techmart  
**Live Site:** https://techmart-zeta.vercel.app  
**Developer Email:** salimaliyuu00@gmail.com

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
lib/              — Shared utilities (db.js, email.js, otp.js)
app/components/   — Shared components (Navbar, Footer, Toast, BackToTop, Button)
scripts/          — Seed scripts (seed-products.js)
```

---

## 4. All Pages Built

### Customer Pages (under `app/(store)/`)
| Page | Path | Description |
|---|---|---|
| Homepage | `/` | Dark hero, product slider, featured products, stats, categories, subscribe |
| Products | `/products` | Listing with search, category filters, sort, wishlist, compare, cart toggle |
| Product Detail | `/products/[id]` | Full detail with color/storage selectors, reviews, add/remove cart, wishlist |
| Cart | `/cart` | "Your Bag" with quantity controls, remove, order summary |
| Checkout | `/checkout` | Shipping form + Paystack payment integration |
| Checkout Success | `/checkout/success` | Payment verification, order confirmed animation |
| Orders | `/orders` | Order history list with status badges |
| Order Detail | `/orders/[id]` | Full order detail with progress tracker, timestamps |
| Wishlist | `/wishlist` | Saved products with add-to-cart and remove |
| Account | `/account` | Profile edit, password change/set, quick links |
| Support | `/support` | Create/list support tickets |
| Support Chat | `/support/[id]` | Chat-style conversation with 30s polling |
| Compare | `/compare` | Side-by-side product comparison (same category, max 3) |
| FAQ | `/faq` | Accordion FAQ with categories |
| Disputes | `/disputes` | Customer dispute list |

### Auth Pages (under `app/auth/`)
| Page | Path |
|---|---|
| Login | `/auth/login` |
| Register | `/auth/register` (with OTP verification) |
| Forgot Password | `/auth/forgot-password` |
| Reset Password | `/auth/reset-password` |
| Verify OTP | `/auth/verify-otp` |
| Verify 2FA | `/auth/verify-2fa` |

### Admin Pages (under `app/admin/`)
| Page | Path | Description |
|---|---|---|
| Dashboard | `/admin` | Stats overview, recent orders |
| Products & Categories | `/admin/products` | CRUD products with variants, specs, per-color images |
| Orders | `/admin/orders` | Manage orders, change status (triggers email + timestamp) |
| Users | `/admin/users` | View registered users |
| Support | `/admin/support` | Manage support tickets, reply to customers |
| Disputes | `/admin/disputes` | Review disputes, approve refunds via Paystack |
| Reviews | `/admin/reviews` | View/delete customer reviews (sends email on delete) |

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

### Orders
- `GET /api/orders` — User's orders
- `POST /api/orders` — Create order
- `GET/PATCH /api/orders/[id]` — Single order

### Checkout & Payment
- `POST /api/checkout/session` — Create Paystack checkout session
- `GET /api/checkout/verify` — Verify payment + deduct stock + send email
- `POST /api/webhooks/paystack` — Paystack webhook (backup payment confirmation)

### Wishlist
- `GET /api/wishlist` — Get user's wishlist
- `POST /api/wishlist` — Add to wishlist
- `DELETE /api/wishlist` — Remove from wishlist

### Reviews
- `GET /api/reviews?productId=X` — Get product reviews
- `POST /api/reviews` — Submit review (must have purchased + delivered)

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
- `GET /api/admin/users` — All users
- `GET/POST /api/admin/categories` — Categories CRUD
- `GET/PATCH/DELETE /api/admin/categories/[id]` — Single category
- `GET /api/admin/support` — All support tickets
- `PATCH /api/admin/support/[id]` — Reply/manage ticket
- `GET /api/admin/disputes` — All disputes
- `PATCH /api/admin/disputes/[id]` — Approve/reject dispute (Paystack refund on approve)
- `GET /api/admin/reviews` — All reviews
- `DELETE /api/admin/reviews/[id]` — Delete review (sends email, recalculates rating)

---

## 6. Database Models

| Model | File | Registered As | Key Fields |
|---|---|---|---|
| User | `models/user.js` | `'User'` | name, email, password (plain text), role, phone |
| Product | `models/product.js` | `'product'` | name, category, colors [{name, hex, image}], variants [{color, storage, sku, price, stock}], specs |
| Order | `models/order.js` | `'order'` | orderNumber, userId, items, shippingAddress, status, totalAmount, confirmedAt, shippedAt, deliveredAt |
| Category | `models/category.js` | `'Category'` | name, slug, specFields |
| Review | `models/Review.js` | `'Review'` | productId, userId, orderId, rating, comment |
| Wishlist | `models/Wishlist.js` | `'Wishlist'` | userId, productId |
| OTPToken | `models/OTPToken.js` | `'OTPToken'` | email, otpHash, purpose, expiresAt |
| SupportTicket | `models/SupportTicket.js` | `'SupportTicket'` | userId, subject, category, messages[], status, priority, userLastReadAt |
| Dispute | `models/Dispute.js` | `'Dispute'` | orderId, userId, reason, description, status, adminNote |
| Refund | `models/Refund.js` | `'Refund'` | disputeId, orderId, amount, status, paystackRefundId |
| Subscriber | `models/Subscriber.js` | `'Subscriber'` | email |
| Coupon | `models/Coupon.js` | `'Coupon'` | (exists but not wired up) |

**IMPORTANT:** Model `ref` names must match registered names exactly. Known pattern:
- User = `'User'` (capital)
- Product = `'product'` (lowercase)
- Order = `'order'` (lowercase)

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
5. **Toast notifications** — Via `useToast()` from `@/app/components/Toast`. Never inline error banners.
6. **Confirmation dialogs** — On all destructive actions (delete, sign out, remove).
7. **Stock deducts on payment only** — Not on add to cart. Validated at checkout, deducted after Paystack confirms.
8. **Email sender** — `noreply@techmartng.store` (requires Resend domain verification for non-test delivery).
9. **Next.js 16 params** — API routes: `const { id } = await params`. Client pages: `const { id } = use(params)`.
10. **Suspense required** — All pages using `useSearchParams()` must wrap content in `<Suspense>`.
11. **Mobile responsive** — All pages use className hooks + `<style>` tag media queries at 768px.
12. **Compare** — Max 3 products, same category only.
13. **Low stock threshold** — 5 units per variant.

---

## 9. Email System

All emails sent via Resend from `noreply@techmartng.store`:
- **OTP emails** — Registration, password reset, 2FA
- **Order confirmation** — Includes item details, total, delivery window
- **Order status changes** — Confirmed, shipped, delivered
- **Dispute resolution** — Approved (with refund amount) or rejected
- **Review deleted** — Notification with reason
- **Subscribe welcome** — For new non-customer subscribers

**Limitation:** Free Resend tier only sends to the account owner's email. Need custom domain verification for production.

---

## 10. Payment Flow (Paystack)

1. Customer fills checkout form → clicks "Pay Now"
2. `POST /api/checkout/session` validates stock, creates pending order, initializes Paystack transaction
3. Customer redirected to Paystack hosted payment page
4. After payment → redirected to `/checkout/success?reference=TM-...`
5. Success page clears cart, calls `GET /api/checkout/verify?reference=TM-...`
6. Verify endpoint: confirms with Paystack API, updates order to 'confirmed', deducts stock, sends email
7. Webhook (`POST /api/webhooks/paystack`) also handles confirmation as backup

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
- Order stage timestamps (confirmedAt, shippedAt, deliveredAt)
- Per-color product images

---

## 12. Known Issues & Things That Needed Fixing

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

---

## 13. What's NOT Built Yet (Future Work)

- **Coupon/discount codes** — Model exists (`models/Coupon.js`) but no API or UI
- **Order cancellation** — No cancel button for pending orders
- **Search auto-suggest** — Search works but no dropdown suggestions
- **Notification bell** — In-app notifications for order updates
- **Product image gallery** — Only one main image + per-color images, no carousel on detail
- **Shipping tracking** — No tracking number field
- **Admin analytics charts** — Dashboard has numbers but no visual charts
- **Dark/light theme toggle** — Currently fixed light theme (was briefly dark, reverted)
- **Recently viewed products** — Not implemented

---

## 14. Deployment Notes

- **Vercel** auto-deploys from `master` branch on push
- **MongoDB Atlas** — Free tier auto-pauses after inactivity. Must resume manually.
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
Then upload images via admin panel at `/admin/products`.

### Key Patterns to Follow
- Use the `C` object for colors in every file
- Use `useToast()` for notifications, never alert() or inline errors
- Use `confirm()` for destructive actions
- All API routes: `import { connectDB } from '@/lib/db'`
- Dynamic params: `await params` in API, `use(params)` in client pages
- Always import models that will be populated (e.g., import User when populating userId)
- Test on mobile — all grids must stack, all layouts must be responsive

---

## 16. Git History Summary

Total commits: ~28 (from initial Next.js scaffold to full e-commerce platform)

Key milestones:
1. `086785f` — Initial complete platform (auth, pages, admin, all features)
2. `d737f01` — Full mobile responsiveness
3. `83089a3` — Support ticket system, wishlist toggle, order emails
4. `b173aab` — Dispute/refund system, admin reviews, stock validation
5. `1d190b8` — Premium homepage with slider, subscribe, animations
6. `9cc52e4` — Final consistency fixes (stock, cart toggle, back buttons)
