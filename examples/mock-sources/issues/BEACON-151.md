---
id: BEACON-151
title: "Webhook signature verification fails when the request body is parsed before verification"
status: open
labels: [webhooks, docs, signature, express]
created: 2026-03-02
updated: 2026-05-01
---

## Summary

Several customers report `401 invalid signature` on every webhook after adding a JSON body parser (for example `express.json()` mounted globally). The signature is computed over the exact raw bytes Beacon sent. Re-serialising parsed JSON changes whitespace and key order, so the computed HMAC never matches.

## Status

Not a product defect. The webhook guide already states that verification must use the raw body. This issue tracks making that warning more prominent and adding framework-specific examples.

## Workaround

Mount `express.raw({ type: 'application/json' })` on the webhook route only, verify the signature against that `Buffer`, then parse the JSON.
