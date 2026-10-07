# Browser SDK release notes

## 3.12.2 (2026-05-04)

- Fixed: events tracked immediately before navigation were dropped in Safari 17 and 18 (BEACON-142). Unload-time flushes use `sendBeacon` again in WebKit browsers.

## 3.12.1 (2026-04-30)

- Fixed: TypeScript type for `beacon.identify()` traits.

## 3.12.0 (2026-04-24)

- Changed: unload-time flushes now use `fetch` with `keepalive` and are triggered on `visibilitychange` instead of `pagehide`.
- Added: `beacon.flush()` returns a promise.

## 3.11.4 (2026-03-30)

- Fixed: duplicate `$pageview` on hash-only route changes.
