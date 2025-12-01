# Stripe Keys Reference

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STRIPE KEYS OVERVIEW                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
  │   Publishable Key    │     │     Secret Key       │     │   Webhook Secret     │
  │   pk_test_...        │     │   sk_test_...        │     │   whsec_...          │
  ├──────────────────────┤     ├──────────────────────┤     ├──────────────────────┤
  │ Client-side          │     │ Server-side          │     │ Server-side          │
  │ (browser)            │     │ (API routes)         │     │ (webhook endpoint)   │
  ├──────────────────────┤     ├──────────────────────┤     ├──────────────────────┤
  │ Stripe Elements      │     │ Create sessions      │     │ Verify webhook       │
  │ (embedded forms)     │     │ Charge cards         │     │ signatures           │
  │                      │     │ Manage customers     │     │                      │
  └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
          │                            │                            │
          │                            │                            │
          ▼                            ▼                            ▼
     NOT NEEDED                     REQUIRED                     REQUIRED
   (using redirect)            (API calls to Stripe)       (receiving webhooks)
```

## Keys We Used

### 1. Secret Key (`sk_test_...`)

| Property | Value |
|----------|-------|
| **Key** | `sk_test_51JXp8J...` (from your Stripe Dashboard) |
| **Source** | Stripe Dashboard |
| **Where to get** | https://dashboard.stripe.com/test/apikeys |
| **Environment** | Test mode (`sk_test_`) / Live mode (`sk_live_`) |

**Used in:**
- `app/api/checkout/route.ts` - Create checkout sessions
- `app/api/webhook/route.ts` - Initialize Stripe client

**How to get:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Find "Secret key" row
3. Click to reveal and copy

### 2. Webhook Secret (`whsec_...`)

| Property | Value |
|----------|-------|
| **Key** | `whsec_...` (from `stripe listen` command) |
| **Source** | Stripe CLI (`stripe listen`) |
| **Scope** | Local development only |

**Used in:**
- `app/api/webhook/route.ts` - Verify webhook signatures

**How to get (Local Development):**
```bash
stripe listen --forward-to localhost:3000/api/webhook
```
Output:
```
> Ready! Your webhook signing secret is whsec_f4280e7785b8fe... (^C to quit)
```

**How to get (Production):**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your URL: `https://yourdomain.com/api/webhook`
4. Select events: `checkout.session.completed`
5. Click "Add endpoint"
6. Click "Reveal" under Signing secret

### 3. Publishable Key (`pk_test_...`) - NOT USED

| Property | Value |
|----------|-------|
| **Key** | `pk_test_51JXp8J...` (from your Stripe Dashboard) |
| **Source** | Stripe Dashboard |
| **Where to get** | https://dashboard.stripe.com/test/apikeys |

**Why not used:**
We used **Stripe Checkout (redirect)** which handles everything on Stripe's hosted page. The publishable key is only needed for **Stripe Elements (embedded)** where you build the payment form yourself.

```
┌─────────────────────────────────────────────────────────────────┐
│            WHEN DO YOU NEED PUBLISHABLE KEY?                     │
└─────────────────────────────────────────────────────────────────┘

  Checkout (Redirect) ← Our approach      Elements (Embedded)
  ────────────────────────────────────────────────────────────────

  User redirects to Stripe.com            Card form on YOUR page

  ┌─────────┐      ┌─────────────┐        ┌─────────────────────┐
  │ Pay Now │ ───> │ Stripe.com  │        │ ┌─────────────────┐ │
  └─────────┘      │ Card Form   │        │ │ Card: [4242...] │ │
                   └─────────────┘        │ │ Exp:  [12/34]   │ │
                                          │ └─────────────────┘ │
  Keys needed:                            └─────────────────────┘
  • sk_test_... ✓
                                          Keys needed:
  pk_test_... NOT NEEDED                  • sk_test_... ✓
                                          • pk_test_... ✓ (client-side)
```

## Environment Variables

### `.env.local` (Current Setup)

```bash
# Required - Server-side API calls
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Required - Webhook signature verification
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Required - Redirect URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional - Only if using Stripe Elements (embedded forms)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Test vs Live Keys

| Environment | Secret Key Prefix | Publishable Key Prefix | Real Charges? |
|-------------|-------------------|------------------------|---------------|
| Test | `sk_test_` | `pk_test_` | No |
| Live | `sk_live_` | `pk_live_` | Yes |

**To go live:**
1. Complete Stripe account activation
2. Replace `sk_test_...` with `sk_live_...` in production
3. Create production webhook endpoint and use that `whsec_...`

## Security Best Practices

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY RULES                               │
└─────────────────────────────────────────────────────────────────┘

  ✅ DO                                 ❌ DON'T
  ─────────────────────────────────────────────────────────────────

  • Store keys in .env.local            • Commit keys to git
  • Add .env.local to .gitignore        • Expose sk_test_... to browser
  • Use environment variables           • Log keys in console
  • Rotate keys if compromised          • Share keys in plain text
  • Use test keys for development       • Use live keys for testing
```

### `.gitignore` Entry

```
# Environment variables (contains secrets)
.env.local
.env*.local
```

## Quick Reference

| Key | Prefix | Side | Purpose |
|-----|--------|------|---------|
| Secret | `sk_test_` / `sk_live_` | Server | API calls to Stripe |
| Publishable | `pk_test_` / `pk_live_` | Client | Initialize Stripe.js |
| Webhook | `whsec_` | Server | Verify webhook signatures |
