Hi Acme Analytics team,

Thanks for the detailed report. The timing and browser pattern you describe match a known issue in browser SDK 3.12.0. In that version, events tracked immediately before a page transition, such as a redirect or route change, could be dropped in Safari 17 and 18 without any client-side error. Chrome was not affected. This was fixed in browser SDK 3.12.2 according to our release notes. We have not yet confirmed that this is the cause in your project.

To confirm, could you please:
1. Run `beacon.version` in the browser console and tell us the result.
2. Tell us whether `checkout_completed` is triggered right before a redirect or client-side navigation.

Upgrading to 3.12.2 or later should address this. In the meantime, our documentation describes two options for events fired just before navigation: pass `{ transport: 'beacon' }` on that `beacon.track()` call, or `await beacon.flush()` before navigating.

If events are still missing after you upgrade, send us the details above and an engineer will take a closer look.

Best regards,
Support
