# Browser SDK: delivery and page lifecycle

Beacon's browser SDK batches events and flushes them every 3 seconds, when the batch reaches 20 events, and when the page is being hidden.

## Events fired before navigation

Events tracked immediately before a redirect, route change or tab close are delivered with an unload-safe transport. If you redirect straight after `beacon.track()`, either:

- pass `{ transport: 'beacon' }` for that call, or
- `await beacon.flush()` before navigating.

## Supported browsers

The two latest major versions of Chrome, Edge, Firefox and Safari.

## Checking the SDK version

Run `beacon.version` in the browser console.
