# Webhooks: verifying signatures

Every webhook request includes a `Beacon-Signature` header: a hex HMAC-SHA256 of the **raw request body**, keyed with your endpoint's signing secret.

## Verify against the raw body

Compute the HMAC over the exact bytes received. Do not parse and re-serialise the JSON first: whitespace and key order will change and the signature will not match. In Express, mount `express.raw({ type: 'application/json' })` on the webhook route.

## Rotating the signing secret

When you rotate a secret, Beacon signs with the new secret immediately. For 24 hours after rotation, requests carry a second header, `Beacon-Signature-Previous`, signed with the old secret, so you can deploy the new secret without downtime. After 24 hours only the new secret is used.

## Timestamps

Requests older than 5 minutes (per the `Beacon-Timestamp` header) should be rejected to prevent replay.
