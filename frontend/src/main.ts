import "./style.css";

type ReviewComment = {
  id: number;
  text: string;
  x: number;
  y: number;
};

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  return element;
}

const app = getElement<HTMLDivElement>("#app");

app.innerHTML = `
  <h1>Dotly</h1>
  <p>Choose a screenshot, then click on it to leave a comment.</p>

  <label for="screenshot-input">Choose screenshot</label>
  <input
    id="screenshot-input"
    type="file"
    accept="image/png,image/jpeg"
  />

  <p id="status-message">No screenshot selected.</p>

  <div id="image-container">
    <div id="image-stage">
      <img id="screenshot" alt="Selected screenshot" hidden />
      <div id="markers"></div>
    </div>
  </div>

  <form id="comment-form" hidden>
    <label for="comment-text">Comment</label>
    <textarea id="comment-text" rows="3" required></textarea>
    <button type="submit">Save comment</button>
    <button id="cancel-comment" type="button">Cancel</button>
  </form>

  <h2>Comments</h2>
  <p>Comments are cleared when you reload or choose another image.</p>
  <ol id="comment-list"></ol>
`;

const input = getElement<HTMLInputElement>("#screenshot-input");
const screenshot = getElement<HTMLImageElement>("#screenshot");
const statusMessage = getElement<HTMLParagraphElement>("#status-message");
const markers = getElement<HTMLDivElement>("#markers");
const form = getElement<HTMLFormElement>("#comment-form");
const commentText = getElement<HTMLTextAreaElement>("#comment-text");
const cancelButton = getElement<HTMLButtonElement>("#cancel-comment");
const commentList = getElement<HTMLOListElement>("#comment-list");

let currentImageUrl: string | null = null;
let comments: ReviewComment[] = [];
let pendingPosition: { x: number; y: number } | null = null;

function closeCommentForm(): void {
  pendingPosition = null;
  commentText.value = "";
  form.hidden = true;
}

function renderComments(): void {
  markers.replaceChildren();
  commentList.replaceChildren();

  for (const comment of comments) {
    const marker = document.createElement("span");
    marker.className = "comment-marker";
    marker.textContent = String(comment.id);
    marker.style.left = `${comment.x * 100}%`;
    marker.style.top = `${comment.y * 100}%`;
    markers.append(marker);

    const item = document.createElement("li");
    item.textContent = comment.text;
    commentList.append(item);
  }
}

input.addEventListener("change", () => {
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    statusMessage.textContent = "Please choose a PNG or JPEG image.";
    return;
  }

  if (currentImageUrl) {
    URL.revokeObjectURL(currentImageUrl);
  }

  comments = [];
  renderComments();
  closeCommentForm();

  currentImageUrl = URL.createObjectURL(file);
  screenshot.hidden = true;
  screenshot.src = currentImageUrl;
  statusMessage.textContent = "Loading screenshot...";
});

screenshot.addEventListener("load", () => {
  screenshot.hidden = false;
  statusMessage.textContent = "Click on the screenshot to add a comment.";
});

screenshot.addEventListener("error", () => {
  screenshot.hidden = true;
  statusMessage.textContent = "Could not display the selected image.";
});

screenshot.addEventListener("click", (event: MouseEvent) => {
  const bounds = screenshot.getBoundingClientRect();

  pendingPosition = {
    x: (event.clientX - bounds.left) / bounds.width,
    y: (event.clientY - bounds.top) / bounds.height,
  };

  form.hidden = false;
  commentText.focus();
});

form.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();

  const text = commentText.value.trim();

  if (!pendingPosition || !text) {
    return;
  }

  comments.push({
    id: comments.length + 1,
    text,
    x: pendingPosition.x,
    y: pendingPosition.y,
  });

  renderComments();
  closeCommentForm();
});

cancelButton.addEventListener("click", closeCommentForm);