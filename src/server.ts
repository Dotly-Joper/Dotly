import express from "express";
import type { Request, Response } from "express";
import type { ZodError } from "zod";
import { openDatabase } from "./db.ts";
import { createProject, listProjects } from "./repository.ts";
import { createProjectSchema } from "./schemas.ts";

const db = openDatabase();
const app = express();

app.use(express.json());
app.use("/screenshots", express.static("screenshots"));

function sendValidationError(res: Response, error: ZodError): void {
  res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request body",
      details: error.issues.map(({ path, message }) => ({ path, message })),
    },
  });
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/api/projects", (req: Request, res: Response) => {
  const result = createProjectSchema.safeParse(req.body);

  if (!result.success) {
    sendValidationError(res, result.error);
    return;
  }

  res.status(201).json(createProject(db, result.data.name));
});

app.get("/api/projects", (_req: Request, res: Response) => {
  res.json(listProjects(db));
});

app.listen(3000, () => {
  console.log("Dotly server listening on http://localhost:3000");
});
