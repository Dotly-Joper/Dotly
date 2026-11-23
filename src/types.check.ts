import type { CommentStatus } from "../shared/types.ts";

// T01: typecheck fails if "done" ever becomes a valid CommentStatus.
// @ts-expect-error
const s: CommentStatus = "done";
