import express from "express";
import type { Request, Response } from "express";
import type { ZodError } from "zod";
import { captureScreenshot } from "./capture.ts";
import { openDatabase } from "./db.ts";
import {
  createProject,
  createReview,
  getProject,
  getReview,
  listProjects,
  markReviewFailed,
  markReviewReady,
} from "./repository.ts";
import { createProjectSchema, createReviewSchema } from "./schemas.ts";

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

function sendNotFound(res: Response, message: string): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message } });
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

app.post(
  "/api/projects/:projectId/reviews",
  async (req: Request<{ projectId: string }>, res: Response) => {
    const result = createReviewSchema.safeParse(req.body);

    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }

    const { projectId } = req.params;

    if (!getProject(db, projectId)) {
      sendNotFound(res, "Project not found");
      return;
    }

    const review = createReview(db, projectId, result.data.url);

    try {
      await captureScreenshot(review.url, `screenshots/${review.id}.png`);
      markReviewReady(db, review.id);
    } catch (error) {
      console.error(`Screenshot failed for review ${review.id}:`, error);
      markReviewFailed(
        db,
        review.id,
        "Skärmbilden kunde inte tas. Kontrollera att adressen finns och svarar.",
      );
    }

    res.status(201).json(getReview(db, review.id));
  },
);

app.listen(3000, () => {
  console.log("Dotly server listening on http://localhost:3000");
});
