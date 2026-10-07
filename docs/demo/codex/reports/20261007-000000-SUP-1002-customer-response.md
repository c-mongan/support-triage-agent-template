Hello,

The deployment timing and verification code point to a likely request-body issue. Beacon signs the exact bytes sent, but your code signs JSON.stringify(req.body) after the shared JSON middleware has parsed it. Re-serializing JSON can change the bytes and invalidate the signature.

Register the webhook route with express.raw({ type: 'application/json' }) before the shared express.json() middleware can consume its body. Compute the HMAC against that raw Buffer using the current endpoint signing secret, then parse JSON only after verification succeeds.

Beacon's documented rotation behavior uses the new secret immediately for Beacon-Signature. For 24 hours, Beacon-Signature-Previous also carries a signature made with the old secret. Updating the secret alone would not fix a body-byte mismatch. Given that the old secret was exposed, use the current secret for this check.

Please share the webhook route and middleware order, the rotation timestamp in UTC, and the delivery ID and result of one fresh delivery after the raw-body change. Do not send signing secrets or customer payloads.

The evidence does not yet establish a rotation fault or permanent event loss. Engineering should confirm the affected deliveries' signing configuration and retry recoverability before any replay. This is a draft recommendation; no replay or system changes have been performed.

