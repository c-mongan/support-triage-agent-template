Thanks for the deployment timeline and verification code. The most likely cause is that the shared JSON middleware parses the webhook body before verification. Beacon signs the exact raw bytes; computing the HMAC from JSON.stringify(req.body) can produce different bytes and fail verification even with the correct secret.

Configure the webhook route to receive the raw body with express.raw({ type: 'application/json' }), before the shared JSON parser processes that route. Compute the HMAC from that Buffer, then parse the JSON after verification succeeds.

Rotation uses the new secret immediately. For 24 hours after rotation, Beacon also supplies Beacon-Signature-Previous using the old secret. Your code checks Beacon-Signature, so it should use the new secret.

Please confirm the middleware order and the UTC rotation time, and provide one fresh delivery ID and its verification result after the raw-body change. Do not send signing secrets or customer payloads. The growing retry queue shows delivery failures; it does not establish permanent event loss. The findings need human review to check the queued deliveries and determine recovery options.
