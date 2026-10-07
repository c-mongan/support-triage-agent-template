Hi Priya,

Thanks for the detailed log and code. Based on what you sent, the most likely cause is how the signature is being computed rather than the secret rotation. Beacon signs the exact raw bytes of the request body. Your verifier hashes `JSON.stringify(req.body)`, and with `express.json()` mounted globally, `req.body` is already parsed, so re-serialising it can change whitespace and key order and the HMAC will not match. Your first failure came right after the shared middleware deploy, and the mismatch continued after you updated the secret, which fits this.

The webhook guide recommends mounting `express.raw({ type: 'application/json' })` on the webhook route only, computing the HMAC over that raw Buffer, and parsing the JSON afterwards. This is also described in a known issue we track for this pattern.

To help us confirm, could you tell us the time you rotated the secret, and whether failing requests include a `Beacon-Signature-Previous` header? If the raw-body change does not resolve it, please reply with the result and a support engineer will look further at the rotation side.

Also, since the secret appeared in the ticket text, please treat it as exposed and consider rotating it again once the fix is in. A support engineer will review what options exist for the queued deliveries.

Best regards,
Beacon Support
