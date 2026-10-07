# Ticket 001: Safari checkout events missing

**Source:** synthetic example (fictional product: Beacon)
**Ticket ID:** SUP-1001
**Customer:** Acme Analytics
**Priority:** P2

Hi team,

Since upgrading our web app yesterday, our checkout completion event is missing for about half of users in Safari. Chrome looks normal.

We send the event from the confirmation page after payment succeeds. Safari users still see the confirmation page, but the event does not appear in our analytics dashboard. This started around 2026-04-28 14:00 UTC after we deployed frontend version `2026.04.28.2`.

Environment:

- Browser: Safari 17 and 18
- App: Next.js
- SDK: browser analytics SDK v3.12.0
- Event: `checkout_completed`
- Region: US

Could this be related to the SDK upgrade?

