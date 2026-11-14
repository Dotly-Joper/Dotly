import express from "express";
import type { NextFunction, Request, Response } from "express";
import { captureScreenshot } from "./capture.ts";
import { openDatabase } from "./db.ts";
import { NotFoundError, ValidationError } from "./errors.ts";
import {
  createProject,
  createReview,
  getProject,
  getReview,
  listProjects,
  listReviews,
  markReviewFailed,
  markReviewReady,
} from "./repository.ts";
import { createProjectSchema, createReviewSchema } from "./schemas.ts";

const db = openDatabase();
const app = express();

app.use(express.json());
app.use("/screenshots", express.static("screenshots"));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/api/projects", (req: Request, res: Response) => {
  const result = createProjectSchema.safeParse(req.body);

  if (!result.success) {
    throw ValidationError.fromZod(result.error);
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
      throw ValidationError.fromZod(result.error);
    }

    const { projectId } = req.params;

    if (!getProject(db, projectId)) {
      throw new NotFoundError("Project not found");
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

app.get(
  "/api/projects/:projectId/reviews",
  (req: Request<{ projectId: string }>, res: Response) => {
    const { projectId } = req.params;

    if (!getProject(db, projectId)) {
      throw new NotFoundError("Project not found");
    }

    res.json(listReviews(db, projectId));
  },
);

app.get(
  "/api/reviews/:reviewId",
  (req: Request<{ reviewId: string }>, res: Response) => {
    const review = getReview(db, req.params.reviewId);

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    res.json(review);
  },
);

// Express recognises error middleware by its four parameters, so _next must stay.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: err.message } });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL", message: "Internal server error" },
  });
});

app.listen(3000, () => {
  console.log("Dotly server listening on http://localhost:3000");
});
