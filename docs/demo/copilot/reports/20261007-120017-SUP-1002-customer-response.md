Hi Priya,

Thanks for the detailed logs and code. They made this easy to narrow down.

Based on what you sent, the signature failures look related to how the request body is read, rather than the secret rotation. Beacon computes the signature over the exact raw bytes of the request body. Your verification code uses JSON.stringify(req.body). With express.json() mounted globally, the body has already been parsed, so re-serialising it changes whitespace and key order and the HMAC will not match. The failures also began right after your middleware deploy, and the secret reload at 14:20 UTC did not change the outcome.

Our webhook documentation recommends mounting express.raw({ type: 'application/json' }) on the webhook route only, computing the HMAC over that raw Buffer, and parsing the JSON afterwards. Please try this on the webhook route.

Separately, please do not post signing secrets in tickets. The value in your message should be treated as exposed, so rotate that secret again once the fix is in place. During the 24 hours after a rotation, requests also carry a Beacon-Signature-Previous header signed with the old secret.

If verification still fails after this change, please send a failing delivery ID, the raw body and Beacon-Signature header of one failed request, and the time of the rotation, and an engineer will take a closer look.

Best regards,
Beacon Support
