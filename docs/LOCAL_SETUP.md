# Run ClikGett on your own computer

Everything runs in Docker and never touches live AWS.

## Start

Needs Docker Desktop and Node.js. From the repository root:

```
cp .env.example .env
docker compose up -d
docker compose ps
```

Wait until the services show `healthy`.

| What | Address |
|---|---|
| Backend API | http://localhost:5001/api |
| Health check | http://localhost:5001/health |
| Admin website | http://localhost:3001 |
| File storage console (MinIO) | http://localhost:9101 |
| MySQL | localhost:3306 |

Database, storage and login settings are in `.env`.

## Run the tests

```
cd Backend
API_URL=http://127.0.0.1:5001/api npm test
```

All suites must pass before deploying. One suite: `npm run test:checkout` (others are
listed in `Backend/package.json`).

## After changing backend code

```
docker compose up -d --build backend
```

Database changes run by themselves when the backend starts.

## Connect the apps

Both apps default to a development address, so set the backend address when building.

| Phone | Address to use |
|---|---|
| Android emulator | `http://10.0.2.2:5001/api` |
| Phone on USB (after `adb reverse tcp:5001 tcp:5001`) | `http://localhost:5001/api` |
| Phone on the same Wi-Fi | `http://<your computer's IP>:5001/api` |

```
# Customer app, from Flutter/UserApp
flutter run --dart-define=API_BASE_URL=<address>

# Delivery app, from Flutter/Deliveryboy (the address must end with /)
./gradlew assembleDebug -PapiBaseUrl=<address>/
```

## Reset

```
docker compose down       # stop, keep the data
docker compose down -v    # stop and wipe all local data
```
