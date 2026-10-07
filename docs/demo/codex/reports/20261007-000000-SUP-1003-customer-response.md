Hi,

Thanks for the precise row counts. Beacon’s Insights CSV export is limited to 10,000 data rows, plus the header, in the table’s current sort order. The 48,212-row total can therefore exceed the CSV size; your result matches the documented limit.

For the full March list, use the Query API with cursor pagination, or narrow the date range and export in batches, keeping each batch below the limit. Scheduled warehouse exports are another option on plans that include them.

Would you prefer the API route or date-range batches? We can help you choose the next step for your finance reconciliation.

