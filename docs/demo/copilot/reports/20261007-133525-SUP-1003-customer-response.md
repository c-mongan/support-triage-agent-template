Hi Sam,

Thanks for getting in touch. The export is working as documented. The Export CSV button on an Insights table downloads up to 10,000 rows, and larger results are cut to the first 10,000 rows in the table's current sort order. The export dialog shows a banner that states this limit.

For your finance reconciliation, you can get the full 48,212 rows in either of these ways:

1. Use the Query API with cursor pagination (GET /api/v2/query with the cursor parameter) to page through the full result.
2. Narrow the date range and export in batches, so each export is under 10,000 rows.

If your plan includes the scheduled warehouse export, that is another option for complete exports. An engineer or account contact can confirm whether it is available on your plan.

Support for larger single-file CSV exports is tracked as a feature request, and I can't commit to a date for it.

Best regards,
Support
