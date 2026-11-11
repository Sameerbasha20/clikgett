# Backend scripts

| Script | What it does |
|---|---|
| `wallet-reconcile.js` | Compares each customer's ClikGett Cash balance with their wallet ledger and lists mismatches. Read-only unless run with `--apply`; run the dry run first. |

Things used regularly live elsewhere:

- Automated tests: `server/tests/` (`npm test`)
- Database migrations: `server/migrations/` (`run_on_start.js` runs on every deploy; the others are one-time release steps listed in `docs/RUNBOOK.md`)
- Release tools: `server/tools/` (`schema_sync.js`, `release_setup.js`, `export_since.js`, media import tools)
