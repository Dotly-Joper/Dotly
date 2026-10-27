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

## Review viewer setup

From the project root:

```bash
cd frontend
npm ci
npm run dev
```

Open the local URL shown in the terminal.

## Add comments

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

- Screenshots are selected manually. The viewer is not yet connected directly to the screenshot script.
- Comments are stored in memory and are cleared when the page reloads or another image is selected.
- Known issue: markers may shift relative to the image content when browser zoom changes. This has not yet been resolved.