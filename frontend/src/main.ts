import "./style.css";
import { getElement } from "./dom";
import { renderDeveloperView } from "./developer-view";
import { renderReviewView } from "./review-view";

const app = getElement<HTMLDivElement>("#app");
const reviewId = new URLSearchParams(window.location.search).get("review");

if (reviewId) {
  renderReviewView(app);
} else {
  renderDeveloperView(app);
}
