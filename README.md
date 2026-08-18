# TrailWrapped

**Your year on the trail, wrapped. And it's actually yours.**

TrailWrapped turns your running and hiking data into a shareable year-in-review, kind of like Spotify Wrapped but for the outdoors. You run it locally or self-host it, and your data doesn't go anywhere unless you decide to share the final card.

No subscription. No paywall. No server sitting on your GPS history.

## Why this exists

Strava's "Year in Sport" recap used to be free. In December 2025 it went behind an $80/year paywall, and a lot of people who spent all year logging runs and hikes suddenly couldn't see their own recap without paying for it.

This is a free, open-source, self-hosted alternative. You own your data, you run the tool, you get the recap. Every year, no subscription.

## Features

- **Automatic recap generation**: total distance, elevation climbed (in terms you can actually picture, like "you climbed Everest 1.3 times"), longest run/hike, fastest pace, longest streak, and more
- **Shareable cards**: export as PNG or a short video, ready to post
- **Local-first**: runs on your own machine or your own server, nothing sent to a third party
- **Works with more than Strava**: connect via Strava OAuth, or just drag in raw GPX/TCX/FIT files from Garmin, Coros, Suunto, Apple Health, whatever you've got
- **Plugin architecture** (in progress): the recap engine is modular so people can add their own stat modules over time — strength training, photo highlights, segment integrity checks, weather correlation, etc.

## Quickstart

```bash
git clone https://github.com/bishtashish708/trailwrapped.git
cd trailwrapped
docker compose up
```

Open `http://localhost:3000`, connect a data source, and generate your recap.

Don't want to use Docker? See [SETUP.md](./SETUP.md) for running it directly with Node.

## How it works

1. Connect a data source: Strava OAuth, or upload GPX/TCX/FIT files directly
2. Your data stays local: activities are normalized and stored in a local SQLite database, no cloud, no telemetry
3. The recap engine computes your stats and renders a shareable card sequence
4. Export and share, or don't. It's yours either way.

## Project status

Early days, actively being built. Right now the focus is:

- [ ] GPX/TCX/FIT ingestion and normalization
- [ ] Strava OAuth integration
- [ ] Core recap engine (v1 stat set)
- [ ] Shareable card renderer
- [ ] Plugin interface for community stat modules

Full plan is in [ROADMAP.md](./ROADMAP.md).

## Contributing

This is meant to be built with the community, not just for it. If you want to add a stat module, fix a bug, or just have an idea, check [CONTRIBUTING.md](./CONTRIBUTING.md).

## Privacy

Your activity data never has to leave your own machine. There's no hosted version storing anyone's data, no analytics, no tracking. Details in [PRIVACY.md](./PRIVACY.md).

## License

[MIT](./LICENSE)
