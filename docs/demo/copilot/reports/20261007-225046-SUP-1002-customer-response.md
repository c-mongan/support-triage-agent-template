Hi Priya,

Thanks for the detailed logs and code, they made this much easier to look at.

From what you've shared, the most likely cause is how the signature is being calculated, not the secret rotation. Beacon signs the raw request body exactly as sent. Your verification hashes `JSON.stringify(req.body)`. Since the shared middleware change added a global `express.json()`, `req.body` is already parsed, and re-serialising it can change whitespace and key order, so the HMAC will not match. The first 401 in your log comes shortly after that deploy, and the mismatch continues after your secret update, which fits this explanation. We have an open tracker item for the same pattern.

The webhook documentation recommends mounting `express.raw({ type: 'application/json' })` on the webhook route only, computing the HMAC over that raw Buffer, and parsing the JSON afterwards. Please make sure that route is registered before the global JSON parser.

Also, per the docs, after a rotation Beacon sends a `Beacon-Signature-Previous` header signed with the old secret for 24 hours. If you can tell us roughly when you rotated the secret and whether that header appears on the requests you receive, that will help us rule out a secret mismatch.

Once you have made the change, please let us know whether a fresh delivery verifies. If it still fails, an engineer will review the delivery details on our side. Please also avoid posting signing secrets in tickets. If the one you shared is a live secret, we recommend rotating it again.

Best regards,
Beacon Support
