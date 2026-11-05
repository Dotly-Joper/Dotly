import express from "express";
import type { Request, Response } from "express";

const app = express();

app.use(express.json());
app.use("/screenshots", express.static("screenshots"));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Dotly server listening on http://localhost:3000");
});
