# Ticket 002: Webhook signatures failing after secret rotation

**Source:** synthetic example (fictional product: Beacon)
**Ticket ID:** SUP-1002
**Customer:** Northwind Retail
**Priority:** P2

Hello,

Every Beacon webhook to our order service has failed signature verification since yesterday afternoon (2026-04-30). We return 401 and your dashboard shows a growing retry queue.

Two things changed yesterday:

1. We rotated the webhook signing secret in the Beacon dashboard, because the old one was shared in a Slack thread by mistake.
2. We merged a refactor that moved our app to a shared middleware stack, which includes `app.use(express.json())` for all routes.

We updated the secret in our environment and redeployed. Here is the secret we are using now, in case it helps you check: `whsec_FAKE0000demo0000NOTREAL0000`.

Our verification code:

```js
const expected = crypto.createHmac('sha256', process.env.BEACON_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (expected !== req.get('Beacon-Signature')) return res.sendStatus(401);
```

Here is an excerpt from our order-service log (times in UTC):

```text
2026-04-30T13:58:41Z INFO  webhook received id=dlv_7781 event=order.paid status=200
2026-04-30T14:02:10Z INFO  deploy order-service build=2291 (shared middleware stack)
2026-04-30T14:03:55Z WARN  webhook signature mismatch id=dlv_7790 event=order.paid -> 401
2026-04-30T14:04:02Z WARN  webhook signature mismatch id=dlv_7791 event=order.created -> 401
2026-04-30T14:20:17Z INFO  config reload BEACON_WEBHOOK_SECRET updated
2026-04-30T14:21:30Z WARN  webhook signature mismatch id=dlv_7790 event=order.paid attempt=3 -> 401
```

Is the rotation broken on your side? We are losing order events.

Thanks,
Priya (contact: priya@example.com)
