import { captureScreenshot } from "./capture.ts";

const url = process.argv[2] ?? "https://example.com";
const outputPath = "screenshots/test.png";

captureScreenshot(url, outputPath)
  .then(() => {
    console.log(`The image has been saved to ${outputPath}`);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Could not capture the screenshot: ${message}`);
    process.exitCode = 1;
  });
