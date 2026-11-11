import type { Project, Review } from "../../shared/types";

const projects: Project[] = [
  { id: "demo-website", name: "Company website", createdAt: "2026-11-11T09:00:00Z" },
  { id: "demo-portfolio", name: "Portfolio", createdAt: "2026-11-11T10:00:00Z" },
];

const reviews: Review[] = [
  {
    id: "demo-homepage",
    projectId: "demo-website",
    url: "https://example.com/",
    createdAt: "2026-11-11T09:10:00Z",
    status: "ready",
    imageUrl: "/screenshots/demo-homepage.png",
  },
  {
    id: "demo-about",
    projectId: "demo-website",
    url: "https://example.com/about",
    createdAt: "2026-11-11T09:20:00Z",
    status: "pending",
  },
  {
    id: "demo-contact",
    projectId: "demo-website",
    url: "https://example.com/contact",
    createdAt: "2026-11-11T09:30:00Z",
    status: "failed",
    errorMessage: "The screenshot could not be captured. The page took too long to load.",
  },
];

export function renderDeveloperView(root: HTMLElement): void {
  root.innerHTML = `
    <header>
      <h1>Dotly</h1>
      <p>Projects and reviews</p>
    </header>
    <p class="demo-notice">Demo data. Open a ready review to try commenting on your own screenshot.</p>
    <section id="projects" aria-label="Projects"></section>
  `;

  const projectList = root.querySelector<HTMLElement>("#projects");
  if (!projectList) {
    throw new Error("Project list not found");
  }

  for (const project of projects) {
    const card = document.createElement("article");
    card.className = "project-card";
    const heading = document.createElement("h2");
    heading.textContent = project.name;
    card.append(heading);

    const projectReviews = reviews.filter((review) => review.projectId === project.id);
    if (projectReviews.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No reviews yet.";
      card.append(emptyMessage);
    } else {
      const list = document.createElement("ul");
      list.className = "review-list";
      for (const review of projectReviews) {
        const item = document.createElement("li");
        const url = document.createElement("p");
        url.className = "review-url";
        url.textContent = review.url;

        const status = document.createElement("span");
        status.className = `review-status status-${review.status}`;

        switch (review.status) {
          case "ready": {
            status.textContent = "Ready";
            const link = document.createElement("a");
            link.href = `?review=${encodeURIComponent(review.id)}`;
            link.textContent = "Open review";
            item.append(url, status, " ", link);
            break;
          }
          case "pending":
            status.textContent = "Capturing screenshot…";
            item.append(url, status);
            break;
          case "failed": {
            status.textContent = "Failed";
            const error = document.createElement("p");
            error.textContent = review.errorMessage;
            item.append(url, status, error);
            break;
          }
        }
        list.append(item);
      }
      card.append(list);
    }
    projectList.append(card);
  }
}
