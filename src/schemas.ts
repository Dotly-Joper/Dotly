import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const createReviewSchema = z.object({
  url: z.url({ protocol: /^https?$/ }),
});

export const createCommentSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  text: z.string().trim().min(1).max(1000),
});

export const updateCommentSchema = z.object({
  status: z.enum(["open", "resolved"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
