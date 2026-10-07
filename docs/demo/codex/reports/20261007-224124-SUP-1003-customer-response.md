Hi,

Thanks for noting the exact row count. Beacon’s Insights CSV export is documented to include up to 10,000 data rows, so your result is consistent with that limit. Larger results include the first 10,000 rows in the table’s current sort order; the export dialog should show a limit banner.

For your full March reconciliation, use the Query API with cursor pagination, or narrow the date range and export in batches. Keep each batch below the limit and use non-overlapping ranges to avoid counting rows twice.

Scheduled warehouse exports are another documented option on plans that include them. If a smaller batch still loses rows, please share its displayed count and exported data-row count so support can review the discrepancy.

