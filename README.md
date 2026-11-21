# Dotly

Dotly is a prototype for website feedback using screenshots and positioned comments.

## Setup

Run from the project root:

```bash
npm ci
npx playwright install chromium
cd frontend
npm ci
```

## Start the app

Start the backend from the project root:

```bash
npm run server
```

The server listens on `http://localhost:3000` and restarts when a source file changes.
The database is created automatically in `data/dotly.db`, and screenshots are saved to `screenshots/<reviewId>.png`.

Then start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open the local URL shown in the terminal. Vite forwards `/api` and `/screenshots` to the server.

The API is described in [docs/api.md](docs/api.md).
Example requests for the VS Code REST Client extension are in [docs/requests.http](docs/requests.http).

## Developer view

The start page lists projects and their reviews from the API.

1. Enter a project name and click "Create project".
2. In a project, enter a page URL and click "Create review". The server captures a screenshot of the page.
3. When the review is ready, click "Copy review link" to copy the link for the customer, or "Open review" to open it yourself.
4. Open "Comments" under a review to see its comments. Click "Mark as resolved" on a comment, or "Reopen" to set it back to open.

## Customer view

The review link has the form `?review=<reviewId>`. It shows the screenshot with the comments saved for that review.

1. Click on the screenshot where you want to leave a comment.
2. Enter your comment in the form below the image.
3. Click "Save comment". A numbered marker appears on the image, and the comment appears in the list below.

Click "Cancel" to close the form without saving. Saved comments are still there when the page is reloaded.

## Capture a single screenshot

Run from the project root to capture a page without the server:

```bash
npm run dev -- "https://example.com"
```

Without a URL, `https://example.com` is captured. The image is saved to `screenshots/test.png` and overwrites the previous one.

## Tests

Run from the project root:

```bash
npm test
```

This runs the backend tests in `src/**/*.test.ts` with Vitest, and then the frontend API tests in `frontend/tests/api.test.ts` with the Node test runner.
The screenshot timeout test (T07) starts a real browser, so Chromium must be installed with `npx playwright install chromium`.

Test cases and results are documented in [docs/tests.md](docs/tests.md).

## Type checking and build

Run from the project root:

```bash
npm run typecheck
```

Run from the `frontend` directory:

```bash
npx tsc --noEmit
npm run build
```

## Current limitations

- There are no user accounts. Anyone with a review link can view the review and add comments.
- Dotly only runs locally. It is not deployed anywhere.
- Comments are not moved to new versions of a page. A new screenshot means a new review without comments.
