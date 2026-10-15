# CLIKGETT — MYSQL TO POSTGRESQL MIGRATION ASSESSMENT REPORT

**Audit Date:** October 14, 2026  
**Source Engine:** MySQL 8.0  
**Target Engine:** PostgreSQL 16  
**Target Container:** `clikgett-postgres` (Port 5433)  
**Status:** **DDL Conversion Verified | Backend Driver Migration Pending (Documented)**  

---

## 1. Executive Migration Summary

As part of the planned architectural evolution from MySQL to PostgreSQL, the complete ClikGett schema was converted into production-grade PostgreSQL DDL (`docker/postgres/init.sql`).

**Current Readiness State:**
- **Database Layer (100% Ready):** PostgreSQL 16 container (`clikgett-postgres`) runs locally with all converted relations, primary keys, foreign key cascades, triggers, and test seed records.
- **Application Layer (Pending pg Driver):** The current Express backend (`Backend/server/utils/db.js`) uses the `mysql` NPM driver and raw MySQL dialect queries (e.g. `ON DUPLICATE KEY UPDATE`, `` `table` `` backtick escaping, `LIMIT 1`, `NOW()`).
- **Safety Directive Compliance:** In strict compliance with the audit instructions, **we do NOT claim PostgreSQL application compatibility until the Node.js backend driver and SQL dialects have been fully refactored and tested against PostgreSQL.**

---

## 2. DDL & Data Type Conversion Matrix

| MySQL 8.0 Construct | PostgreSQL 16 Equivalent | Migration Rationale & Implementation Details |
| :--- | :--- | :--- |
| `INT AUTO_INCREMENT` | `SERIAL PRIMARY KEY` | Standard sequence-backed auto-incrementing integer |
| `BIGINT AUTO_INCREMENT`| `BIGSERIAL PRIMARY KEY`| Standard 64-bit sequence-backed identifier |
| `DATETIME` | `TIMESTAMP WITHOUT TIME ZONE` | PostgreSQL timestamps store date and time down to microsecond precision |
| `ON UPDATE CURRENT_TIMESTAMP` | Trigger with `update_updated_at_column()` | PostgreSQL does not support inline `ON UPDATE` attributes on columns; implemented via PL/pgSQL function and table trigger |
| `TINYINT(1)` | `SMALLINT` or `BOOLEAN` | Preserved as `SMALLINT` (0/1) to match existing Express integer comparisons (`Status === 1`) |
| `DECIMAL(10,2)` | `NUMERIC(10,2)` | Exact arbitrary-precision numeric storage for currency and pricing |
| `TEXT` | `TEXT` | Variable-length text fields map directly |
| Backtick Identifiers (`` `Users` ``) | Double-Quote Identifiers (`"Users"`) | Preserves case-sensitivity across PascalCase table names |
| `ON DUPLICATE KEY UPDATE` | `ON CONFLICT (...) DO UPDATE` | PostgreSQL upsert syntax requires explicit target unique constraint |

---

## 3. Query Compatibility Gaps in Existing Backend Code

Before switching the active backend to PostgreSQL, the following SQL patterns in `Backend/server/controllers/` require refactoring:

1. **Backtick Identifier Quoting:**
   - *Current Code:* `SELECT * FROM \`Products\` WHERE \`Status\` = 1`
   - *PostgreSQL Requirement:* PostgreSQL uses double quotes (`"Products"`) for quoted identifiers. Backticks result in `syntax error at or near "\`"`.
2. **Upsert Syntax:**
   - *Current Code:* `INSERT INTO Products (...) VALUES (...) ON DUPLICATE KEY UPDATE ProductID = LAST_INSERT_ID(ProductID)`
   - *PostgreSQL Requirement:* `INSERT INTO "Products" (...) VALUES (...) ON CONFLICT ("ProductID") DO UPDATE SET ...`
3. **Driver Connection Pool:**
   - *Current Driver:* `const mysql = require('mysql')`
   - *Target Driver:* `const { Pool } = require('pg')` or an ORM/Query Builder (e.g. `Kysely`, `Prisma`, or `Knex`).
4. **Parameter Placeholders:**
   - *Current Code:* `pool.query('SELECT * FROM Users WHERE UserID = ?', [id])`
   - *PostgreSQL Requirement:* `pg.query('SELECT * FROM "Users" WHERE "UserID" = $1', [id])`
5. **String Concatenation in Queries:**
   - MySQL allows `CONCAT(a, b)` or `+` in some legacy patterns; PostgreSQL requires `a || b` or `CONCAT(a, b)`.

---

## 4. Phase-by-Phase PostgreSQL Transition Plan

1. **Phase 1 (Complete):** Provision local isolated PostgreSQL 16 container with replicated DDL and triggers.
2. **Phase 2:** Implement dual-driver abstraction layer in `Backend/server/utils/db.js` supporting `DB_DRIVER=mysql|postgres`.
3. **Phase 3:** Parameterize SQL queries to use dialect-neutral query builders (`$1` vs `?`).
4. **Phase 4:** Run automated endpoint test harness against local PostgreSQL instance.
5. **Phase 5:** Production data migration using `pgloader` or custom stream pipeline.
