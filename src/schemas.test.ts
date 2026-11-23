import { describe, expect, it } from "vitest";
import {
  createCommentSchema,
  createProjectSchema,
  createReviewSchema,
  updateCommentSchema,
} from "./schemas.ts";

const valid = { x: 0.5, y: 0.5, text: "Fix the logo" };

describe("T03: comment text and coordinates", () => {
  it.each([
    ["empty", ""],
    ["only spaces", "   "],
    ["1001 characters", "a".repeat(1001)],
  ])("rejects text that is %s", (_, text) => {
    expect(createCommentSchema.safeParse({ ...valid, text }).success).toBe(false);
  });

  it("accepts text with 1000 characters", () => {
    expect(createCommentSchema.safeParse({ ...valid, text: "a".repeat(1000) }).success).toBe(true);
  });

  it.each([
    ["x 1.2", { x: 1.2 }],
    ["y -0.1", { y: -0.1 }],
    ['x "0.5" as a string', { x: "0.5" }],
  ])("rejects %s", (_, coords) => {
    expect(createCommentSchema.safeParse({ ...valid, ...coords }).success).toBe(false);
  });

  it.each([0, 1])("accepts %s as x and y", (n) => {
    expect(createCommentSchema.safeParse({ ...valid, x: n, y: n }).success).toBe(true);
  });
});

describe("T04: review URL, comment status and project name", () => {
  it.each(["not-a-url", "ftp://x.se"])("rejects URL %j", (url) => {
    expect(createReviewSchema.safeParse({ url }).success).toBe(false);
  });

  it.each(["https://example.com", " https://example.com "])("accepts URL %j", (url) => {
    expect(createReviewSchema.safeParse({ url }).success).toBe(true);
  });

  it("rejects status done", () => {
    expect(updateCommentSchema.safeParse({ status: "done" }).success).toBe(false);
  });

  it.each(["open", "resolved"])("accepts status %s", (status) => {
    expect(updateCommentSchema.safeParse({ status }).success).toBe(true);
  });

  it("rejects an empty project name", () => {
    expect(createProjectSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
