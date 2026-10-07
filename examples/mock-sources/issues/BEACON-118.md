---
id: BEACON-118
title: "Safari ITP: anonymous users reset after 7 days, inflating unique user counts"
status: closed
resolution: wont-fix
labels: [browser-sdk, safari, identity, itp]
created: 2025-11-12
updated: 2026-01-08
---

## Summary

Safari Intelligent Tracking Prevention caps script-written first-party cookies at seven days. Anonymous visitors who return after more than seven days get a new anonymous ID, so unique-user counts are higher in Safari.

## Notes

This affects identity continuity, not event delivery. Events are still received. Documented as a browser limitation; the recommended mitigation is server-side identification after login.
