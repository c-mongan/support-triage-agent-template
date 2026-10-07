Hi Sam,

Thanks for the detail. The 10,000-row figure is a limit on the Export CSV button, not a fault with your data. The documentation says the button downloads up to 10,000 rows and truncates larger results to the first 10,000 rows in the table's current sort order. The export dialog also shows a banner that states the limit.

For your finance reconciliation, you have two options that the documentation describes:

1. Use the Query API with cursor pagination (GET /api/v2/query with the cursor parameter) to pull the full March result set.
2. Narrow the date range, for example to a week at a time, and export each batch separately. Each batch needs to stay under 10,000 rows.

The documentation also mentions a scheduled warehouse export on plans that include it. A support engineer can confirm whether your plan includes it.

A larger single-file CSV export is on our backlog as a feature request, and no delivery date has been set.

Please let us know if you would like help setting up either approach.

Best regards,
Beacon Support
