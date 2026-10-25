import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

async function captureScreenshot(url: string): Promise<void> {
  await mkdir("screenshots", { recursive: true });

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    await page.goto(url, {
      waitUntil: "load",
      timeout: 30_000,
    });

    await page.screenshot({
      path: "screenshots/test.png",
      fullPage: true,
    });

    console.log("The image has been saved to screenshots/test.png");
  } finally {
    await browser.close();
  }
}

const url = process.argv[2] ?? "https://example.com";

captureScreenshot(url).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Could not capture the screenshot: ${message}`);
  process.exitCode = 1;
});