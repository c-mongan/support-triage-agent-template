# Response: Safari checkout completion event missing after SDK upgrade

**Issue:** Acme Analytics — synthetic ticket
**Date:** 2026-05-05

---

Hi team,

Thanks for the detailed context — the deployment timestamp, the browser breakdown, and the SDK version made this much faster to diagnose.

What appears to be happening:

- The issue is isolated to Safari and started exactly at your frontend deploy on 2026-04-28 14:00 UTC, which lines up with the SDK bump to v3.12.0.
- Safari is more aggressive than Chrome about cancelling in-flight requests during page transitions. If the confirmation page redirects, unmounts, or unloads soon after the event is fired, Safari can drop the request unless the SDK uses `sendBeacon` or `fetch` with `keepalive` — both of which are designed for exactly this case.
- Whether v3.12.0 of your SDK changed how it handles that unload path is the part we cannot confirm yet without seeing the SDK vendor's release notes.

The fastest test: explicitly flush or `await` the SDK call before redirecting, closing, or unmounting the confirmation page. If you have a `flush()` method available, use that. Alternatively, move the event fire into a `visibilitychange` handler that runs when the page transitions to `hidden`. If Safari starts seeing the events again, that confirms the timing hypothesis and you have a workaround you can ship today.

To narrow this down further, could you share:

1. The code that fires `checkout_completed` on the confirmation page.
2. A network-tab capture from Safari for one affected checkout — specifically, what status code (if any) the analytics request gets.
3. The name of the analytics SDK vendor, so we can check the v3.12.0 release notes for any change to the unload-delivery path.

If the network log shows the request succeeded but the event still does not appear in the dashboard, that points to an SDK or ingestion-side issue and we should escalate it for engineering review. I will come back to you the same business day once we have those.

Thanks,
Support
