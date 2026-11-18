import type { Review, ReviewComment } from "../../shared/types";
import { ApiError, fetchJson } from "./api";
import { getElement } from "./dom";
import type { LoadState } from "./state";

export function renderReviewView(app: HTMLElement, reviewId: string): void {
  app.innerHTML = `
    <a href="?">Back to projects</a>
    <h1>Dotly</h1>
    <p id="status-message"></p>

    <div id="image-container">
      <div id="image-stage">
        <img id="screenshot" alt="Selected screenshot" hidden />
        <div id="markers"></div>
      </div>
    </div>

    <p id="comments-error" hidden></p>

    <form id="comment-form" hidden>
      <label for="comment-text">Comment</label>
      <textarea
        id="comment-text"
        rows="3"
        placeholder="Beskriv vad du vill ändra och hur du vill ha det."
      ></textarea>
      <p id="form-error" hidden></p>
      <button id="save-comment" type="submit">Save comment</button>
      <button id="cancel-comment" type="button">Cancel</button>
    </form>

    <h2>Comments</h2>
    <ol id="comment-list"></ol>
  `;

  const screenshot = getElement<HTMLImageElement>("#screenshot");
  const statusMessage = getElement<HTMLParagraphElement>("#status-message");
  const markers = getElement<HTMLDivElement>("#markers");
  const commentsError = getElement<HTMLParagraphElement>("#comments-error");
  const form = getElement<HTMLFormElement>("#comment-form");
  const commentText = getElement<HTMLTextAreaElement>("#comment-text");
  const formError = getElement<HTMLParagraphElement>("#form-error");
  const saveButton = getElement<HTMLButtonElement>("#save-comment");
  const cancelButton = getElement<HTMLButtonElement>("#cancel-comment");
  const commentList = getElement<HTMLOListElement>("#comment-list");

  let state: LoadState<Review> = { status: "idle" };
  let comments: ReviewComment[] = [];
  let pendingPosition: { x: number; y: number } | null = null;

  function closeCommentForm(): void {
    pendingPosition = null;
    commentText.value = "";
    formError.hidden = true;
    formError.textContent = "";
    form.hidden = true;
  }

  function renderComments(): void {
    markers.replaceChildren();
    commentList.replaceChildren();

    comments.forEach((comment, index) => {
      const marker = document.createElement("span");
      marker.className = "comment-marker";
      marker.classList.toggle("comment-marker-resolved", comment.status === "resolved");
      marker.textContent = String(index + 1);
      marker.style.left = `${comment.x * 100}%`;
      marker.style.top = `${comment.y * 100}%`;
      markers.append(marker);

      const item = document.createElement("li");
      item.textContent = comment.text;
      commentList.append(item);
    });
  }

  async function loadComments(): Promise<void> {
    commentsError.hidden = true;
    commentsError.textContent = "";

    try {
      comments = await fetchJson<ReviewComment[]>(`/api/reviews/${reviewId}/comments`);
      renderComments();
    } catch (error) {
      commentsError.hidden = false;
      commentsError.textContent =
        error instanceof Error ? error.message : "Kunde inte hämta kommentarerna.";
    }
  }

  screenshot.addEventListener("click", (event: MouseEvent) => {
    const bounds = screenshot.getBoundingClientRect();

    pendingPosition = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };

    formError.hidden = true;
    formError.textContent = "";
    form.hidden = false;
    commentText.focus();
  });

  form.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();

    if (!pendingPosition) {
      return;
    }

    const text = commentText.value.trim();
    const { x, y } = pendingPosition;

    saveButton.disabled = true;
    formError.hidden = true;
    formError.textContent = "";

    try {
      const created = await fetchJson<ReviewComment>(
        `/api/reviews/${reviewId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x, y, text }),
        },
      );

      comments.push(created);
      renderComments();
      closeCommentForm();
    } catch (error) {
      formError.hidden = false;
      if (error instanceof ApiError && error.status === 400) {
        formError.textContent = `Kommentaren kunde inte sparas: ${error.message}`;
      } else if (error instanceof Error) {
        formError.textContent = error.message;
      } else {
        formError.textContent = "Kommentaren kunde inte sparas.";
      }
    } finally {
      saveButton.disabled = false;
    }
  });

  cancelButton.addEventListener("click", closeCommentForm);

  function render(): void {
    switch (state.status) {
      case "idle":
      case "loading": {
        screenshot.hidden = true;
        statusMessage.textContent = "Laddar granskning…";
        break;
      }
      case "error": {
        screenshot.hidden = true;
        if (state.error instanceof ApiError && state.error.status === 404) {
          statusMessage.textContent = "Granskningen hittades inte";
        } else {
          statusMessage.textContent = state.error.message;
        }
        break;
      }
      case "success": {
        const review = state.data;
        switch (review.status) {
          case "ready": {
            statusMessage.textContent = "";
            screenshot.src = review.imageUrl;
            screenshot.hidden = false;
            void loadComments();
            break;
          }
          case "pending": {
            screenshot.hidden = true;
            statusMessage.textContent = "Skärmbilden tas fortfarande.";
            break;
          }
          case "failed": {
            screenshot.hidden = true;
            statusMessage.textContent = review.errorMessage;
            break;
          }
          default: {
            const unreachableReview: never = review;
            throw new Error(`Unhandled review status: ${String(unreachableReview)}`);
          }
        }
        break;
      }
      default: {
        const unreachable: never = state;
        throw new Error(`Unhandled load state: ${String(unreachable)}`);
      }
    }
  }

  async function loadReview(): Promise<void> {
    state = { status: "loading" };
    render();

    try {
      const review = await fetchJson<Review>(`/api/reviews/${reviewId}`);
      state = { status: "success", data: review };
    } catch (error) {
      state = {
        status: "error",
        error: error instanceof Error ? error : new Error("Kunde inte ladda granskningen."),
      };
    }

    render();
  }

  void loadReview();
}
