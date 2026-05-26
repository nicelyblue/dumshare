# Dumshare

Dumshare is a local-first expense sharing app for small groups. It helps you track shared costs, review balances, and generate settlement recommendations with a mobile-first flow.

## Features

- Create and manage shared ledgers with multiple participants
- Capture expenses with split modes and per-currency handling
- View ledger history and participant balance snapshots
- Generate settlement recommendations and shareable settlement views
- Local-first data storage with offline-friendly behavior

## Tech Stack

- Expo (React Native)
- TypeScript
- Expo Router
- AsyncStorage and SQLite-oriented data layers
- Vitest for tests

## Prerequisites

- Node.js 20+
- npm 10+
- Expo CLI (via `npx expo`)

## Installation

```bash
npm ci
```

## Environment Configuration

Copy `.env.example` to `.env` and adjust values as needed.

```bash
cp .env.example .env
```

Current environment variables:

- `EXPO_PUBLIC_PREFILL_DUMMY_DATA`: set to `1` to preload demo data on startup, or `0` to disable.

## Run the App

```bash
npx expo start
```

Then open on Android/iOS simulator or Expo Go.

## Run Tests

```bash
npm test
```

## Build Android APK

Preferred public-release path is EAS Build.

1. Ensure EAS is authenticated and project is configured.
2. Run Android build:

```bash
npx eas build -p android --profile production
```

If signing or EAS configuration is missing, a debug/local artifact may be generated for testing only, not production distribution.

## Project Structure

- `app/`: route-driven Expo screens
- `src/mobile/`: UI components, controllers, theme, app services
- `src/domain/`: business/domain logic
- `src/data/`: persistence and data access
- `src/tests/`: automated tests

## Releases

Official APK artifacts are published in GitHub Releases, not committed to the repository.

## Security

- Do not commit secrets, keystores, signing files, or private credentials.
- See `SECURITY.md` for reporting guidance.

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md` before opening changes.

## License

Licensed under GNU GPL v3.0 or later. See `LICENSE`.
