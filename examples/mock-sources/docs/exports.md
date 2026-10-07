# Exporting data

## CSV export from the UI

The **Export CSV** button on any Insights table downloads up to **10,000 rows**. Larger results are truncated to the first 10,000 rows in the table's current sort order. A banner in the export dialog states the limit.

## Full exports

For complete exports, use the Query API with cursor pagination (`GET /api/v2/query` with the `cursor` parameter), or the scheduled warehouse export on plans that include it.
