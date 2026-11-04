export type CommentStatus = "open" | "resolved";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

interface ReviewBase {
  id: string;
  projectId: string;
  url: string;
  createdAt: string;
}

export type Review =
  | (ReviewBase & { status: "pending" })
  | (ReviewBase & { status: "ready"; imageUrl: string })
  | (ReviewBase & { status: "failed"; errorMessage: string });

export interface ReviewComment {
  id: string;
  reviewId: string;
  x: number; // 0–1, andel av bildens bredd från vänster
  y: number; // 0–1, andel av bildens höjd från toppen
  text: string;
  status: CommentStatus;
  createdAt: string;
}
