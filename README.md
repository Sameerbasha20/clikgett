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
| [docs/LOCAL_DOCKER_SETUP.md](docs/LOCAL_DOCKER_SETUP.md) | Running everything on your own computer |
| [docs/LOCAL_TESTING_GUIDE.md](docs/LOCAL_TESTING_GUIDE.md) | Testing locally |

## Quick start

```
docker compose up -d
cd Backend
API_URL=http://127.0.0.1:5001/api npm test
```

Never commit `.env` files, keys or signing files.
