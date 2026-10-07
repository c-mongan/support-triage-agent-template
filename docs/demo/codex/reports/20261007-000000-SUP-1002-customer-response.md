Hello,

Thanks for the code and deployment timeline. The likely cause is the body-parser change: Beacon signs the exact raw request bytes, but your verifier signs JSON.stringify(req.body). Parsing and re-serializing JSON can change those bytes, causing verification to fail even with the correct secret.

Mount express.raw({ type: 'application/json' }) on the webhook route before the shared express.json() middleware can consume that request. Compute the HMAC over the resulting Buffer, verify it, and only then parse the JSON.

Rotation uses the new secret immediately; the previous-secret signature is supplied in a separate header for 24 hours. Keep using the current secret for Beacon-Signature.

Please share the middleware order and the delivery ID, timestamp, and HTTP status from one test after this change, without sending secrets or payload contents. If verification still fails, an engineer should check the endpoint’s signing configuration. We cannot yet confirm whether all queued order events remain recoverable.

