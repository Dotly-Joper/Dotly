import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, fetchJson } from "../src/api.ts";

test("returns JSON from a successful response", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json([{ id: "project-1" }]));
  assert.deepEqual(await fetchJson("/api/projects"), [{ id: "project-1" }]);
});

test("reads the nested API error and keeps its HTTP status", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    error: { code: "VALIDATION_ERROR", message: "Invalid request body" },
  }, { status: 400 }));
  await assert.rejects(fetchJson("/api/projects"), {
    name: "ApiError", status: 400, code: "VALIDATION_ERROR", message: "Invalid request body",
  });
});

test("handles an empty 502 response", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 502 }));
  await assert.rejects(fetchJson("/api/projects"), { name: "ApiError", status: 502, code: "NETWORK" });
});

test("handles invalid JSON even when the HTTP status is 200", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("<html>Error</html>"));
  await assert.rejects(fetchJson("/api/projects"), { name: "ApiError", status: 200, code: "NETWORK" });
});

test("handles a server that cannot be reached", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(fetchJson("/api/projects"), (error) =>
    error instanceof ApiError && error.status === 0 && error.code === "NETWORK",
  );
});
