Hi,

Thanks for including the Safari versions, SDK version, and deployment time. This looks consistent with a documented SDK 3.12.0 regression that can drop events sent immediately before navigation in Safari 17 and 18. We still need to confirm whether your checkout flow reaches that delivery path.

The release notes record a fix in SDK 3.12.2. Please test that version with the same checkout flow. If you need an interim workaround, the documented options are to pass `{ transport: 'beacon' }` to the event's `beacon.track()` call, or use `await beacon.flush()` before navigating.

Could you share a sanitized snippet showing the event call and any following redirect or route change, plus the result of `beacon.version` from an affected browser? Please also confirm whether the issue is still occurring. If it persists with the fixed version, a support engineer will need to review a sanitized network trace to distinguish this regression from another cause.

