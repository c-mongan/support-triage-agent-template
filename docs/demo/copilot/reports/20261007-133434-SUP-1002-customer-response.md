Subject: Webhook signature failures after secret rotation (SUP-1002)

Hi Priya,

Thanks for the detailed logs. They help narrow this down.

Based on what you sent, the secret rotation does not look like the cause. Two details point to the request body handling instead:

- The first failure (14:03 UTC) came about a minute after your 14:02 deploy of the shared middleware stack.
- Failures continued after your secret was updated at 14:20 UTC.

Beacon computes the Beacon-Signature header as an HMAC-SHA256 of the raw request body. Our webhook documentation says to compute it over the exact bytes received and not to parse and re-serialise the JSON first, because whitespace and key order change and the signature will no longer match. Your verification code uses JSON.stringify(req.body). With express.json() mounted globally, req.body is already parsed, so the re-serialised string can differ from what Beacon sent.

What to try:

1. Mount express.raw({ type: 'application/json' }) on the webhook route only, so the handler receives the raw Buffer.
2. Compute the HMAC over that Buffer, compare it with the Beacon-Signature header, and only then parse the JSON.
3. Make sure express.json() does not run before the webhook route. Route order matters in a shared middleware stack.

For reference, the docs page on verifying webhook signatures covers this (the "Verify against the raw body" section). We have an open internal item about making this guidance more prominent, and it describes the same symptom after adding a global JSON parser.

On rotation: Beacon signs with the new secret immediately. For 24 hours after a rotation, requests also carry a Beacon-Signature-Previous header signed with the old secret.

Please also remove the signing secret you pasted in your ticket from any further messages. You have already rotated it once, and the one in this ticket should be treated as exposed. If it is your live secret, rotate it again.

If verification still fails after switching to the raw body, please send us:
- The delivery ID of one failing request (for example dlv_7790).
- Confirmation of which secret is configured on the endpoint in the dashboard, without pasting the value.
- Whether the Beacon-Signature-Previous header is present on the failing requests.

An engineer will review the failing deliveries if the problem persists. On the retry queue, please check the dashboard for the retry behaviour that applies to your endpoint, as I have not confirmed it here.

Best regards,
Beacon Support
