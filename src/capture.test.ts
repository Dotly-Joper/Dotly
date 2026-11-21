import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { captureScreenshot } from "./capture.ts";

// Some networks refuse 10.255.255.1 at once instead of letting it time out; both count as long as it is fast.
it("T07: rejects an unreachable URL within the time limit", { timeout: 15_000 }, async () => {
  const start = Date.now();

  const error = await captureScreenshot(
    "http://10.255.255.1",
    join(tmpdir(), "dotly-t07.png"),
    { timeoutMs: 3000 },
  ).then(() => undefined, (e: unknown) => e);

  const elapsed = Date.now() - start;
  console.log(`T07 rejected after ${elapsed} ms: ${String(error).split("\n")[0]}`);
  expect(error).toBeInstanceOf(Error);
  // 3 s goto plus browser start-up; far below the 30 s default, so the option is used.
  expect(elapsed).toBeLessThan(10_000);
});
