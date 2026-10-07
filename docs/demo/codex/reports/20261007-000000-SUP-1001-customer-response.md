Thanks for the details about the Safari versions and the SDK upgrade. This looks like a documented regression in browser SDK 3.12.0 that can drop events sent immediately before navigation in Safari 17 and 18. It closely matches your symptoms, but we need to confirm the timing of your checkout event.

The release notes list a fix in SDK 3.12.2. Please test that version with the same checkout flow. If you need an interim workaround, pass `{ transport: 'beacon' }` to the affected `beacon.track()` call, or use `await beacon.flush()` before navigating.

Could you share a sanitized snippet showing the `checkout_completed` call and any redirect or route change that follows it? If events still go missing with the fix, a sanitized Safari network capture from one affected test checkout will help an engineer investigate. Please remove payment details, personal data, cookies, and tokens.

