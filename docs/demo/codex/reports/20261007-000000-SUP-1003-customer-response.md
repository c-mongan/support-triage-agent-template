Thanks for including both row counts. Beacon's Insights CSV export from the UI is limited to the first 10,000 rows in the table's current sort order. Your reported cutoff matches that documented limit.

For the full March list, use the Query API with cursor pagination. Alternatively, narrow the date range and export smaller batches, keeping each result within 10,000 rows. For reconciliation, use non-overlapping ranges and check the combined row count against the table total with the same filters.

If you were already exporting through the Query API rather than the UI, please let us know so we can investigate that separately.
