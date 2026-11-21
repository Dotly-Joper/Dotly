import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "./db.ts";
import { NotFoundError } from "./errors.ts";
import {
  createComment,
  createProject,
  createReview,
  getProject,
  getReview,
  listComments,
  updateCommentStatus,
} from "./repository.ts";

const input = { x: 0.25, y: 0.75, text: "Make the button bigger" };

let db: DatabaseSync;

beforeEach(() => {
  db = openDatabase(":memory:");
});

afterEach(() => {
  db.close();
});

function seedReview() {
  const project = createProject(db, "Website");
  return createReview(db, project.id, "https://example.com");
}

describe("T06: repository", () => {
  it("creates and reads back a project, review and comment", () => {
    const project = createProject(db, "Website");
    const review = createReview(db, project.id, "https://example.com");
    const comment = createComment(db, review.id, input);

    expect(getProject(db, project.id)).toEqual(project);
    expect(getReview(db, review.id)).toEqual(review);
    expect(listComments(db, review.id)).toEqual([comment]);
  });

  it("gives a new comment status open and can toggle it", () => {
    const review = seedReview();
    const comment = createComment(db, review.id, input);
    expect(comment.status).toBe("open");

    expect(updateCommentStatus(db, comment.id, "resolved").status).toBe("resolved");
    expect(listComments(db, review.id)[0]?.status).toBe("resolved");

    expect(updateCommentStatus(db, comment.id, "open").status).toBe("open");
    expect(listComments(db, review.id)[0]?.status).toBe("open");
  });

  it("throws NotFoundError for a comment on a review that does not exist", () => {
    expect(() => createComment(db, "missing-review", input)).toThrow(NotFoundError);
  });

  it("throws NotFoundError when updating an unknown comment", () => {
    expect(() => updateCommentStatus(db, "missing-comment", "resolved")).toThrow(NotFoundError);
  });

  it("lists comments only for the requested review", () => {
    const first = seedReview();
    const second = seedReview();
    const a = createComment(db, first.id, input);
    const b = createComment(db, second.id, { ...input, text: "Other review" });

    expect(listComments(db, first.id)).toEqual([a]);
    expect(listComments(db, second.id)).toEqual([b]);
  });
});
