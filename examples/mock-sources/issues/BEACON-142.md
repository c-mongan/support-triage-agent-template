---
id: BEACON-142
title: "Safari: events tracked on the final page before navigation are dropped since browser SDK 3.12.0"
status: closed
resolution: fixed
fixed_in: browser-sdk 3.12.2
labels: [bug, browser-sdk, safari, delivery, regression]
created: 2026-04-29
updated: 2026-05-04
---

## Summary

Since browser SDK 3.12.0, events captured immediately before a page transition or tab close are dropped in Safari 17 and 18. Chrome and Firefox are unaffected.

## Details

3.12.0 replaced the `navigator.sendBeacon` unload transport with `fetch(..., { keepalive: true })` and moved the flush from `pagehide` to `visibilitychange`. In Safari, keepalive requests started during a client-side route change or redirect are cancelled before they leave the browser, so the request never reaches ingestion. No error is logged on the client.

Reported symptoms:

- Conversion or confirmation-page events missing for roughly 30–60% of Safari sessions.
- Events fired earlier on the same page arrive normally.
- Server-side ingestion logs show no rejected requests; the requests are never received.

## Workaround

Pass `{ transport: 'beacon' }` to `beacon.track()` for events fired immediately before navigation, or call `await beacon.flush()` before redirecting.

## Fix

Fixed in browser SDK 3.12.2: the SDK restores the `sendBeacon` transport for unload-time flushes in WebKit browsers.
