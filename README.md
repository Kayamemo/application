# Kaya Marketplace

A multi-niche service marketplace (Fiverr-like) for local services — gardening, tutoring, babysitting, craftwork, and more.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS + React Query |
| Backend | Node.js + Express + Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe (subscriptions + escrow) |
| Real-time chat | Socket.io |
| File uploads | Cloudinary |

## Project Structure

```
App/
├── server/          — Express API
│   ├── prisma/      — Database schema + seed
│   └── src/
│       ├── routes/      — API endpoints
│       ├── middleware/  — Auth, roles, errors
│       └── services/    — Stripe, Socket.io, Cloudinary, email
├── client/          — React frontend
│   └── src/
│       ├── pages/       — All page components
│       ├── components/  — Reusable UI
│       ├── contexts/    — Auth + Socket state
│       └── services/    — API client (Axios)
└── docker-compose.yml   — Local PostgreSQL
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL)
- Stripe account (free test mode)
- Cloudinary account (free tier)

---

### 1. Clone & install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
# Server
cp .env.example server/.env
# Edit server/.env with your values

# Client
cp client/.env.example client/.env
# Add your Stripe publishable key
```

**Required values in `server/.env`:**
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` — from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- `STRIPE_SELLER_PRICE_ID` — create a $7/month recurring price in Stripe → Products
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — from [Cloudinary Console](https://cloudinary.com/console)

### 3. Start the database

```bash
docker-compose up -d
```

PostgreSQL is now running at `localhost:5432`.
pgAdmin UI is at [http://localhost:5050](http://localhost:5050) (admin@kaya.app / admin).

### 4. Run database migrations & seed

```bash
cd server
npx prisma migrate dev --name init
node prisma/seed.js
```

This creates all tables and seeds:
- 10 service niches (Gardening, Tutoring, Cleaning, etc.)
- An admin account: `admin@kaya.app` / `Admin1234!`
- A demo seller account: `demo-seller@kaya.app` / `Demo1234!`

### 5. Start the development servers

```bash
# Terminal 1 — API server (port 4000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 6. Test Stripe webhooks (optional)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) then:

```bash
stripe listen --forward-to localhost:4000/api/payments/webhook
```

Copy the webhook signing secret into `server/.env` as `STRIPE_WEBHOOK_SECRET`.

---

## User Flows

### Buyer flow
1. Register as Buyer
2. Browse services via Home or Explore
3. Click a service → select package → Checkout (Stripe)
4. Chat with seller via Messages
5. Mark order as complete → write a review

### Seller flow
1. Register as Seller (14-day free trial)
2. Go to Seller Dashboard → subscribe ($7/month)
3. Create a service with packages, images, description
4. Receive orders → chat with buyers → mark as Delivered
5. Buyer accepts → escrow released to seller

### Admin flow
1. Log in as `admin@kaya.app`
2. Visit `/admin` → manage users, orders, disputes
3. Resolve disputes (in favor of buyer or seller)
4. Add/remove niches

---

## Deployment (Railway / Render)

### Server (Railway)

1. Create a new Railway project → add a **PostgreSQL** plugin
2. Connect your GitHub repo → set root directory to `server/`
3. Set all environment variables from `.env.example`
4. Start command: `npm start`
5. After deploy: run `npx prisma migrate deploy` in Railway shell

### Client (Render / Vercel / Netlify)

1. Create a Static Site → set root to `client/`
2. Build command: `npm run build`
3. Publish directory: `dist/`
4. Add env var: `VITE_STRIPE_PUBLISHABLE_KEY`
5. Update `server/.env`: `CLIENT_URL=https://your-client-domain.com`

### Stripe in production

- Switch to live Stripe keys
- Update your webhook endpoint URL in the Stripe Dashboard
- Set `STRIPE_WEBHOOK_SECRET` from the live webhook

---

## Adding a New Niche

Two ways:

**Option A — Via Admin Panel:**
Go to `/admin` → Niches → Create (coming soon in UI)

**Option B — Via API:**
```bash
curl -X POST http://localhost:4000/api/niches \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Dog Training","icon":"🐕","description":"Professional dog training services"}'
```

**Option C — Via seed:**
Add to `server/prisma/seed.js` niches array and re-run `node prisma/seed.js`.

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/niches` | List niches |
| GET | `/api/services?niche=gardening&q=lawn` | Search services |
| POST | `/api/services` | Create service (seller) |
| POST | `/api/orders` | Place order |
| PATCH | `/api/orders/:id/deliver` | Mark delivered (seller) |
| PATCH | `/api/orders/:id/complete` | Confirm + release escrow (buyer) |
| POST | `/api/payments/subscribe` | Start seller subscription |
| POST | `/api/payments/webhook` | Stripe webhook |
| GET | `/api/admin/stats` | Platform stats (admin) |

---

## Environment Variables Reference

See [.env.example](.env.example) for all variables with descriptions.
