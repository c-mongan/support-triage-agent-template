Hi Acme Analytics team,

Thanks for the detailed report. What you describe matches a known issue in browser SDK 3.12.0 that affected Safari 17 and 18. Events tracked immediately before a page navigation or redirect could be dropped in Safari, while Chrome was unaffected. The release notes list a fix in browser SDK 3.12.2.

Could you check the following?
1. Run `beacon.version` in the browser console to confirm which SDK version is live.
2. Tell us whether the confirmation page redirects or navigates right after `checkout_completed` is tracked.

If you are on 3.12.0, upgrading to 3.12.2 or later should address this. In the meantime, our documentation describes two options for events fired just before navigation: pass `{ transport: 'beacon' }` on that `track()` call, or `await beacon.flush()` before navigating.

If events are still missing in Safari after upgrading, please let us know and an engineer will investigate further.

Best regards,
Support
