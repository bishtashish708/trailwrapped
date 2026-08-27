# Roadmap

Rough plan, order isn't fixed.

## v0.1 — core recap (shipped)
- [x] GPX/TCX/FIT file parser and normalization into a common activity schema
- [x] Strava OAuth flow and activity import
- [x] Local SQLite storage
- [x] Core stats: total distance, elevation gain, longest activity, fastest pace, longest streak
- [x] First version of the shareable card renderer (PNG export)

## v0.2 — polish
- [x] Docker one-command setup — shipped early, in v0.1
- [x] Best month stat — shipped early, in v0.1
- [ ] Video/GIF export
- [ ] More stat variety (most consistent week, elevation in relatable comparisons beyond Everest)
- [ ] Better error handling for messy/incomplete GPX files

## v0.3 — plugins
- [ ] Define a stable `RecapModule` interface
- [ ] Docs for writing your own module
- [ ] A couple of example community modules to prove it out (photo highlights, strength training stats)

## Later / ideas
- Support for more platforms (Garmin Connect, Coros, Suunto direct sync instead of just file export)
- Multi-year comparisons
- Segment/leaderboard integrity checks as an optional module

If you want to pick something up, comment on the related issue or open one if it doesn't exist yet.
