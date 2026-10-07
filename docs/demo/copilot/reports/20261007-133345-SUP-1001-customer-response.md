Hi Acme Analytics team,

Thanks for the detailed report. The timing and symptoms you describe (Safari 17 and 18 only, about half of sessions, starting after moving to browser SDK 3.12.0) match a known issue in our tracker. In SDK 3.12.0, events tracked immediately before a page navigation could be dropped in Safari. Our release notes list this as fixed in 3.12.2.

We have not yet confirmed this is the cause in your project, so here is what we suggest:

1. Upgrade the browser SDK to 3.12.2 or later and re-test checkout in Safari. You can check the running version by entering `beacon.version` in the browser console.
2. If you need a mitigation first, our documentation describes two options for events fired right before a redirect or route change: pass `{ transport: 'beacon' }` on that `track()` call, or `await beacon.flush()` before navigating.

To help us confirm, could you tell us whether `checkout_completed` is sent immediately before a redirect or client-side route change, and share the `beacon.version` value from a Safari session? If events are still missing on 3.12.2 or later, let us know and an engineer will investigate further.

Best regards,
Support
