# Dotly

Initial implementation of website screenshot capture.

## Setup

```bash
npm ci
npx playwright install chromium
```

## Run

Capture the default example page:

```bash
npm run dev
```

Capture a specified page:

```bash
npm run dev -- "https://example.com"
```

Screenshots are saved to `screenshots/test.png`.
Each successful capture overwrites the previous image.

## Type checking

```bash
npm run typecheck
```