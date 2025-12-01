# Stripe Payment Flow Reference

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STRIPE PAYMENT FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐         ┌──────────────┐         ┌──────────────┐         ┌─────────┐
│  Browser │         │  Next.js App │         │    Stripe    │         │ Webhook │
│  (User)  │         │  localhost   │         │   Servers    │         │ Handler │
└────┬─────┘         └──────┬───────┘         └──────┬───────┘         └────┬────┘
     │                      │                        │                      │
     │ 1. Click "Pay Now"   │                        │                      │
     │─────────────────────>│                        │                      │
     │                      │                        │                      │
     │                      │ 2. POST /api/checkout  │                      │
     │                      │  (create session)      │                      │
     │                      │───────────────────────>│                      │
     │                      │                        │                      │
     │                      │ 3. Return session URL  │                      │
     │                      │<───────────────────────│                      │
     │                      │                        │                      │
     │ 4. Redirect to       │                        │                      │
     │    Stripe Checkout   │                        │                      │
     │<─────────────────────│                        │                      │
     │                      │                        │                      │
     │ 5. User enters card: 4242 4242 4242 4242      │                      │
     │──────────────────────────────────────────────>│                      │
     │                      │                        │                      │
     │                      │                        │ 6. Process payment   │
     │                      │                        │    - Validate card   │
     │                      │                        │    - Charge $10.00   │
     │                      │                        │                      │
     │                      │                        │ 7. Send webhooks     │
     │                      │                        │────────────────────────────>│
     │                      │                        │  • charge.succeeded         │
     │                      │                        │  • payment_intent.succeeded │
     │                      │                        │  • checkout.session.completed
     │                      │                        │                      │
     │                      │                        │                      │ 8. Log/Save
     │                      │                        │                      │    to DB
     │                      │                        │<────────────────────────────│
     │                      │                        │      [200 OK]        │
     │                      │                        │                      │
     │ 9. Redirect to /success                       │                      │
     │<──────────────────────────────────────────────│                      │
     │                      │                        │                      │
     ▼                      ▼                        ▼                      ▼
```

## Webhook Events

| Event | Description |
|-------|-------------|
| `charge.succeeded` | Card was charged successfully |
| `payment_intent.succeeded` | Payment completed |
| `checkout.session.completed` | ★ **Main event** - use this to sync with your DB |
| `payment_intent.created` | Payment intent was created |
| `payment_intent.payment_failed` | Card declined or payment error |
| `checkout.session.expired` | Session timed out (default 24h) |

## When Are Webhooks Sent?

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK TRIGGER MATRIX                        │
└─────────────────────────────────────────────────────────────────┘

  User Action                         Webhook Sent?
  ─────────────────────────────────────────────────────────────────

  Completes payment                   ✅ checkout.session.completed
                                      ✅ charge.succeeded
                                      ✅ payment_intent.succeeded

  Clicks "Back" / closes page         ❌ No webhook
                                      (just redirects to cancel_url)

  Card declined                       ✅ payment_intent.payment_failed

  Session expires (24h default)       ✅ checkout.session.expired
```

**Important**: Cancellation (user clicking back) does NOT trigger any webhook. The user is simply redirected to your `cancel_url`. No payment was attempted, so Stripe has nothing to report.

### Tracking Abandoned Checkouts

If you need to track abandoned checkouts, you can:

1. **Listen for `checkout.session.expired`** - fires after session timeout (default 24h)
2. **Track in your database**:
   - Store session ID when created (mark as "pending")
   - Update to "completed" on `checkout.session.completed`
   - Update to "expired" on `checkout.session.expired`
   - Remaining "pending" sessions after 24h = abandoned

## Checkout Session Data

When `checkout.session.completed` fires, you receive:

```json
{
  "sessionId": "cs_test_a1D7HXgq9aCm18DJv3zzeS66LMDE4L1sp71oy4xfvOMpBedj7Iw33P81cb",
  "customerEmail": "huangwaleking@gmail.com",
  "amountTotal": 1000,
  "paymentStatus": "paid"
}
```

- `amountTotal` is in **cents** (1000 = $10.00)
- `paymentStatus` will be `"paid"` for successful payments

## Page Wireframes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PAGE WIREFRAMES                                     │
└─────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────┐
│  /  (Home Page)                     │
│  app/page.tsx                       │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   Hello World Payment       │    │
│  │                             │    │
│  │   Test product for $10.00   │    │
│  │                             │    │
│  │   ┌─────────────────────┐   │    │
│  │   │      Pay Now        │   │    │
│  │   └─────────────────────┘   │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
└──────────────────┬──────────────────┘
                   │
                   │ Click "Pay Now"
                   │ POST /api/checkout
                   ▼
┌─────────────────────────────────────┐
│  Stripe Checkout (External)         │
│  checkout.stripe.com                │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Pay $10.00                 │    │
│  │                             │    │
│  │  Email: [____________]     │    │
│  │                             │    │
│  │  Card:  [4242 4242 4242]   │    │
│  │  Exp:   [12/34]  CVC:[123] │    │
│  │                             │    │
│  │  ┌─────────────────────┐   │    │
│  │  │        Pay          │   │    │
│  │  └─────────────────────┘   │    │
│  │                             │    │
│  │  ← Back                     │    │
│  └─────────────────────────────┘    │
│                                     │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    Payment OK          User Cancels
         │                   │
         ▼                   ▼
┌─────────────────┐   ┌─────────────────┐
│  /success       │   │  /cancel        │
│  app/success/   │   │  app/cancel/    │
│  page.tsx       │   │  page.tsx       │
├─────────────────┤   ├─────────────────┤
│                 │   │                 │
│ ┌─────────────┐ │   │ ┌─────────────┐ │
│ │             │ │   │ │             │ │
│ │ ✅ Payment  │ │   │ │ ❌ Payment  │ │
│ │ Successful! │ │   │ │ Cancelled   │ │
│ │             │ │   │ │             │ │
│ │ Thank you   │ │   │ │ Your payment│ │
│ │ for your    │ │   │ │ was         │ │
│ │ purchase.   │ │   │ │ cancelled.  │ │
│ │             │ │   │ │             │ │
│ │ Back to Home│ │   │ │ Try Again   │ │
│ │             │ │   │ │             │ │
│ └─────────────┘ │   │ └─────────────┘ │
│                 │   │                 │
└────────┬────────┘   └────────┬────────┘
         │                     │
         │    Click link       │
         └──────────┬──────────┘
                    │
                    ▼
              Back to /
```

## API Routes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           API ROUTES (No UI)                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│  POST /api/checkout                 │
│  app/api/checkout/route.ts          │
├─────────────────────────────────────┤
│                                     │
│  Request:  (none)                   │
│                                     │
│  Response: { url: "https://..." }   │
│            → Stripe checkout URL    │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  POST /api/webhook                  │
│  app/api/webhook/route.ts           │
├─────────────────────────────────────┤
│                                     │
│  Request:  Stripe webhook event     │
│            (from Stripe servers)    │
│                                     │
│  Response: { received: true }       │
│                                     │
│  Events handled:                    │
│  • checkout.session.completed       │
│  • payment_intent.payment_failed    │
│                                     │
└─────────────────────────────────────┘
```

## Navigation Summary

```
                    ┌───────────┐
                    │     /     │
                    │   Home    │
                    └─────┬─────┘
                          │
                          │ Pay Now
                          ▼
                 ┌─────────────────┐
                 │ Stripe Checkout │
                 │   (External)    │
                 └────────┬────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             │             ▼
     ┌──────────┐         │      ┌──────────┐
     │ /success │         │      │ /cancel  │
     └────┬─────┘         │      └────┬─────┘
          │               │           │
          └───────────────┴───────────┘
                          │
                          ▼
                    ┌───────────┐
                    │     /     │
                    │   Home    │
                    └───────────┘
```

## Project Structure

```
stripe/
├── app/
│   ├── api/
│   │   ├── checkout/route.ts   # Creates Stripe checkout session
│   │   └── webhook/route.ts    # Receives Stripe webhook events
│   ├── success/page.tsx        # Payment success page
│   ├── cancel/page.tsx         # Payment cancelled page
│   ├── layout.tsx
│   └── page.tsx                # Main payment page
├── .env.local                  # Environment variables (secrets)
├── .env.local.example          # Template for env vars
├── package.json
├── tsconfig.json
└── next.config.js
```

## Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...        # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...      # From `stripe listen` or Dashboard
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your Stripe keys
```

### 3. Start webhook forwarding (Terminal 1)
```bash
stripe listen --forward-to localhost:3000/api/webhook
```
Copy the `whsec_...` secret to `.env.local`

### 4. Start Next.js (Terminal 2)
```bash
npm run dev
```

### 5. Test payment
- Go to http://localhost:3000
- Click "Pay Now"
- Use test card: `4242 4242 4242 4242` (any future date, any CVC)

## Production Setup

### 1. Configure webhook endpoint in Stripe Dashboard
- Go to https://dashboard.stripe.com/webhooks
- Add endpoint: `https://yourdomain.com/api/webhook`
- Select events: `checkout.session.completed`
- Copy signing secret to production environment

### 2. Environment variables
```bash
STRIPE_SECRET_KEY=sk_live_...        # Live secret key
STRIPE_WEBHOOK_SECRET=whsec_...      # From Dashboard webhook settings
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0027 6000 3184` | Requires authentication (3D Secure) |

## Key Concepts

### Why use webhooks?
- **Reliability**: Even if user closes browser, you still get notified
- **Security**: Stripe signs webhooks, preventing tampering
- **Async**: Payments process asynchronously; webhooks notify completion

### Webhook signature verification
The `STRIPE_WEBHOOK_SECRET` ensures webhooks actually came from Stripe:

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### Idempotency
Stripe may send the same webhook multiple times. Use `event.id` to deduplicate:

```typescript
// Check if already processed
const existing = await db.orders.findUnique({
  where: { stripeEventId: event.id }
});
if (existing) return; // Skip duplicate
```
