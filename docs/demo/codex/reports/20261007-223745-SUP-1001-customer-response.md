Thanks for the detailed report, especially the SDK version and Safari/Chrome comparison. This likely relates to a Safari event-delivery regression in Beacon browser SDK 3.12.0. It affects events sent immediately before navigation; the recorded fix is in 3.12.2. We still need to confirm that timing in your checkout flow.

Please test upgrading to 3.12.2. If you need a temporary workaround for events immediately before navigation, pass `{ transport: 'beacon' }` to `beacon.track()`, or `await beacon.flush()` before redirecting.

Does a redirect, route change, or tab close follow `checkout_completed` immediately? Please share a sanitized snippet showing the event call and any subsequent navigation, plus the result of `beacon.version` in an affected Safari session. If events remain missing after the controlled test, a support engineer should review the findings with engineering.
