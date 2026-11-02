# ClikGett

Grocery delivery platform: a customer app, a delivery partner app, an admin website and
the backend they all use.

```
clikgett-code/
├── Backend/                  Node.js + Express API (MySQL, S3)
│   ├── server/
│   │   ├── server.js         Entry point
│   │   ├── routes/           URL definitions
│   │   ├── controllers/      Request handlers
│   │   ├── services/         Business logic (pricing, orders, rewards, payments)
│   │   ├── utils/            Database, storage, auth helpers
│   │   ├── migrations/       Database changes (run_on_start.js runs on every deploy)
│   │   ├── tools/            Release tools (schema_sync, release_setup, export_since)
│   │   └── tests/            Automated tests (npm test)
│   ├── scripts/              One-off helpers, see scripts/README.md
│   └── images/               Logo and font used in invoices
├── Admin/                    Admin website (React)
│   └── src/
│       ├── Components/       Screens, grouped by menu section
│       └── Services.js       All API calls
├── Flutter/
│   ├── UserApp/              Customer app (Flutter: Android + iOS)
│   │   └── lib/new/          Current code (screens, controllers, services, models)
│   ├── Deliveryboy/          Delivery partner app (native Android, Java)
│   └── build-release.ps1     Builds both apps for the stores
├── docker/                   Local database and storage setup
├── docs/                     Guides (start with RUNBOOK.md)
├── .github/workflows/        iOS TestFlight build
├── docker-compose.yml        Local development stack
└── render.yaml               Test environment
```

## Documentation

| Guide | Use it for |
|---|---|
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Deploying, rolling back, secrets, daily checks |
| [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) | Running and testing everything on your own computer |
| [docs/audit/AUDIT_REPORT.md](docs/audit/AUDIT_REPORT.md) | Security and code audit, with evidence |
| [docs/testing/TEST_REPORT.md](docs/testing/TEST_REPORT.md) | Test results, defects and what is not tested |

Never commit `.env` files, keys or signing files.
