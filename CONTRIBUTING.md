# Contributing

Thanks for your interest in contributing to Dumshare.

## Development Setup

1. Install dependencies:

```bash
npm ci
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Run tests:

```bash
npm test
```

4. Start app:

```bash
npx expo start
```

## Pull Request Guidelines

- Keep PRs focused and small.
- Include tests for behavior changes when possible.
- Do not commit secrets, signing files, or local machine artifacts.
- Update docs when setup or behavior changes.
