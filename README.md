# Dotly

Dotly is a prototype for website feedback using screenshots and positioned comments.

## Screenshot script setup

Run from the project root:

```bash
npm ci
npx playwright install chromium
```

## Capture a screenshot

Run from the project root.

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

Run from the project root:

```bash
npm run typecheck
```

## Backend

Run from the project root, after the screenshot script setup above:

```bash
npm run server
```

The server listens on `http://localhost:3000` and restarts when a source file changes.
The database is created automatically in `data/dotly.db`, and screenshots are saved to `screenshots/<reviewId>.png`.

The API is described in [docs/api.md](docs/api.md).
Example requests for the VS Code REST Client extension are in [docs/requests.http](docs/requests.http).

## Review viewer setup

From the project root:

```bash
cd frontend
npm ci
npm run dev
```

Open the local URL shown in the terminal.

The start page shows the developer view with hardcoded example projects and reviews.
It includes ready, pending, and failed reviews, plus a project with no reviews.
Click "Open review" on a ready review to open the screenshot viewer, or add
`?review=demo-homepage` to the URL. Use "Back to projects" to return.
The review ID currently selects the view only; it does not load a screenshot.

## Add comments

Open a ready review from the developer view first.

1. Click "Choose screenshot" and select a PNG or JPEG image, for example `screenshots/test.png` from the project folder.
2. Click on the image where you want to leave a comment.
3. Enter your comment in the form below the image.
4. Click "Save comment".
5. A numbered marker appears on the image, and the comment appears in the list below.

Click "Cancel" to close the form without saving.

## Frontend build

Run from the `frontend` directory:

```bash
npm run build
```

## Current limitations

- The viewer is not yet connected to the backend API. Screenshots are selected manually, and projects and reviews are hardcoded examples.
- In the viewer, comments are stored in memory and are cleared when the page reloads or another image is selected.
- Known issue: markers may shift relative to the image content when browser zoom changes. This has not yet been resolved.
