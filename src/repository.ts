import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import type { Project, Review } from "../shared/types.ts";

export function createProject(db: DatabaseSync, name: string): Project {
  const project: Project = {
    id: randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  };

  db.prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)").run(
    project.id,
    project.name,
    project.createdAt,
  );

  return project;
}

export function listProjects(db: DatabaseSync): Project[] {
  return db
    .prepare("SELECT id, name, created_at FROM projects ORDER BY created_at DESC")
    .all()
    .map(toProject);
}

export function getProject(db: DatabaseSync, id: string): Project | undefined {
  const row = db
    .prepare("SELECT id, name, created_at FROM projects WHERE id = ?")
    .get(id);

  return row ? toProject(row) : undefined;
}

function toProject(row: Record<string, unknown>): Project {
  const { id, name, created_at } = row;

  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof created_at !== "string"
  ) {
    throw new Error(`Invalid project row: ${JSON.stringify(row)}`);
  }

  return { id, name, createdAt: created_at };
}

export function createReview(
  db: DatabaseSync,
  projectId: string,
  url: string,
): Review {
  const review: Review = {
    id: randomUUID(),
    projectId,
    url,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  db.prepare(
    "INSERT INTO reviews (id, project_id, url, status, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(review.id, review.projectId, review.url, review.status, review.createdAt);

  return review;
}

export function markReviewReady(db: DatabaseSync, id: string): void {
  db.prepare(
    "UPDATE reviews SET status = 'ready', error_message = NULL WHERE id = ?",
  ).run(id);
}

export function markReviewFailed(
  db: DatabaseSync,
  id: string,
  message: string,
): void {
  db.prepare(
    "UPDATE reviews SET status = 'failed', error_message = ? WHERE id = ?",
  ).run(message, id);
}

export function listReviews(db: DatabaseSync, projectId: string): Review[] {
  return db
    .prepare(
      "SELECT id, project_id, url, status, error_message, created_at FROM reviews WHERE project_id = ? ORDER BY created_at DESC",
    )
    .all(projectId)
    .map(toReview);
}

export function getReview(db: DatabaseSync, id: string): Review | undefined {
  const row = db
    .prepare(
      "SELECT id, project_id, url, status, error_message, created_at FROM reviews WHERE id = ?",
    )
    .get(id);

  return row ? toReview(row) : undefined;
}

function toReview(row: Record<string, unknown>): Review {
  const { id, project_id, url, status, error_message, created_at } = row;

  if (
    typeof id !== "string" ||
    typeof project_id !== "string" ||
    typeof url !== "string" ||
    typeof created_at !== "string"
  ) {
    throw new Error(`Invalid review row: ${JSON.stringify(row)}`);
  }

  const base = { id, projectId: project_id, url, createdAt: created_at };
  // The cast only lets the switch type-check; any other value still ends up in default and throws.
  const reviewStatus = status as Review["status"];

  switch (reviewStatus) {
    case "pending":
      return { ...base, status: "pending" };
    case "ready":
      return { ...base, status: "ready", imageUrl: `/screenshots/${id}.png` };
    case "failed":
      if (typeof error_message !== "string") {
        throw new Error(`Invalid review row: ${JSON.stringify(row)}`);
      }
      return { ...base, status: "failed", errorMessage: error_message };
    default: {
      const unexpected: never = reviewStatus;
      throw new Error(`Invalid review status ${String(unexpected)}: ${JSON.stringify(row)}`);
    }
  }
}
