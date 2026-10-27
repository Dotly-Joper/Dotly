import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App element was not found.");
}

app.innerHTML = `
  <h1>Dotly</h1>
  <p>Choose a screenshot to review.</p>

  <label for="screenshot-input">Choose screenshot</label>
  <input
    id="screenshot-input"
    type="file"
    accept="image/png,image/jpeg"
  />

  <p id="status-message">No screenshot selected.</p>

  <div id="image-container">
    <img id="screenshot" alt="Selected screenshot" hidden />
  </div>
`;

const input =
  document.querySelector<HTMLInputElement>("#screenshot-input");
const screenshot =
  document.querySelector<HTMLImageElement>("#screenshot");
const statusMessage =
  document.querySelector<HTMLParagraphElement>("#status-message");

if (!input || !screenshot || !statusMessage) {
  throw new Error("Required viewer elements were not found.");
}

let currentImageUrl: string | null = null;

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

  currentImageUrl = URL.createObjectURL(file);

  screenshot.src = currentImageUrl;
  screenshot.hidden = false;
  statusMessage.textContent = `Selected: ${file.name}`;
});