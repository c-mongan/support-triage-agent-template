Hi Acme Analytics team,

Thanks for the detailed report. The pattern you describe, with Safari 17 and 18 affected, Chrome normal, and an event fired on the confirmation page that started after moving to browser SDK 3.12.0, matches a known issue in our tracker (BEACON-142). In that issue, events tracked immediately before a page transition in Safari could be dropped without any client-side error. Our release notes list a fix in browser SDK 3.12.2.

Our browser SDK docs describe two options for events sent right before a redirect or route change: pass `{ transport: 'beacon' }` on that `beacon.track()` call, or `await beacon.flush()` before navigating.

To confirm this is the same cause, could you please let us know:
1. The output of `beacon.version` in the browser console.
2. Whether `checkout_completed` is fired immediately before a redirect or route change.

If you are on 3.12.2 or later and still see missing events, please tell us and a support engineer will review your case further.

Best regards,
Beacon Support
