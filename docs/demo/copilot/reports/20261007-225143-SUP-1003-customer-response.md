Hi Sam,

Thanks for the detail. The export is behaving as documented rather than failing. The Export CSV button on an Insights table downloads up to 10,000 rows, and larger results are cut off at the first 10,000 rows in the table's current sort order. The export dialog shows a banner stating this limit. That matches the 10,000 rows plus header you are seeing for your 48,212-row March table.

For a complete list for your finance reconciliation, the documentation describes these options:

1. Use the Query API with cursor pagination (GET /api/v2/query with the cursor parameter) to retrieve all rows.
2. Use the scheduled warehouse export, on plans that include it. An engineer or your account contact can confirm whether your plan does.
3. Narrow the date range and export in several batches, so each export stays under 10,000 rows.

Raising the UI limit is tracked as an open feature request. We cannot give a delivery date for it.

If you tell us which option suits you, we can help with the details.

Best regards,
Support
