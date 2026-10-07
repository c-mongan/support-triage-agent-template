Hi Sam,

Thanks for getting in touch. The export is behaving as documented, so it is not a fault with your account. The Export CSV button on an Insights table downloads up to 10,000 rows. Larger results are cut off at the first 10,000 rows in the table's current sort order. The export dialog also shows a banner stating this limit.

To get all 48,212 rows for your finance reconciliation, the documentation (exports page) describes these options:

1. Use the Query API with cursor pagination (GET /api/v2/query with the cursor parameter) to retrieve the full result set.
2. Use the scheduled warehouse export, on plans that include it. Please check your plan to see whether it is available to you.
3. Narrow the date range, for example by week, and export in batches so that each file is under 10,000 rows.

Exporting more than 10,000 rows in a single CSV is an open feature request on our backlog. I can't give you a delivery date for it.

If you would like help choosing between these options, let us know and an engineer can confirm the best fit for your plan.

Best regards,
Support
