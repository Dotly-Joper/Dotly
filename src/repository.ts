import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import type { Project } from "../shared/types.ts";

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
    .prepare("SELECT id, name, created_at FROM projects ORDER BY created_at")
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
