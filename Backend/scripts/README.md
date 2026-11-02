# Backend scripts

One-off helpers. None of them run with the server, and the server does not depend on them.
Run them from `Backend/` so they find `.env`. Check which database `.env` points at first:
several of these write data.

| Folder | What is in it |
|---|---|
| `checks/` | Read-only looks at data and schema (`check_*`, `inspect_*`, `describe_all`) |
| `verify/` | End-to-end checks written for past features (`verify_*`, `test_*`, audits). Not part of `npm test`; some may be out of date |
| `db-one-offs/` | Old one-time data and schema changes, kept for reference. Do not re-run on live |
| `endpoint-audit/` | Tools that list every API route and audit them; `api_inventory_result.json` is their output |

Things that are used regularly live elsewhere:

- Automated tests: `server/tests/` (`npm test`)
- Database migrations: `server/migrations/` (`run_on_start.js` runs on every deploy)
- Release tools: `server/tools/` (`schema_sync.js`, `release_setup.js`, `export_since.js`)
