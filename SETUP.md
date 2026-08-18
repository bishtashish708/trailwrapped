# Setup

## Option 1: Docker (recommended)

```bash
git clone https://github.com/<your-username>/trailwrapped.git
cd trailwrapped
docker compose up
```

Open `http://localhost:3000`.

## Option 2: Run it directly

Requires Node 20+.

```bash
git clone https://github.com/<your-username>/trailwrapped.git
cd trailwrapped

# server
cd apps/server
npm install
npm run dev

# in a second terminal, web
cd apps/web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Strava OAuth (optional)

If you want to connect Strava instead of uploading files:

1. Create an app at https://www.strava.com/settings/api
2. Copy `apps/server/.env.example` to `apps/server/.env`
3. Fill in your `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`
4. Restart the server

This step is entirely optional, GPX/TCX/FIT upload works without it.
