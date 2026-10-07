Hi,

The Safari versions, SDK version, and missing confirmation-page events you described match a documented event-delivery regression in browser SDK 3.12.0. It affects events sent immediately before navigation; we still need to confirm whether that timing applies to your checkout flow.

The release notes document a fix in SDK 3.12.2. Please upgrade to that version and compare a test checkout in Safari with Chrome. If you need an interim workaround, the delivery guide recommends passing `{ transport: 'beacon' }` to `beacon.track()` for the affected event, or calling `await beacon.flush()` before redirecting.

Could you share a sanitized snippet showing where `checkout_completed` is sent and whether a redirect, route change, or tab close follows it? If it still fails after upgrading, please include one sanitized Safari network capture and the deployed SDK version from `beacon.version` so an engineer can confirm the delivery path.

