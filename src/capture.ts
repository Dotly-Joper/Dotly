import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { chromium } from "playwright";

export async function captureScreenshot(
  url: string,
  outputPath: string,
  { timeoutMs = 30_000 }: { timeoutMs?: number } = {},
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    await page.goto(url, {
      waitUntil: "load",
      timeout: timeoutMs,
    });

    await page.screenshot({
      path: outputPath,
      fullPage: true,
    });
  } finally {
    await browser.close();
  }
}
