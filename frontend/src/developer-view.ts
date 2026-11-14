import type { Project, Review } from "../../shared/types";
import { ApiError, fetchJson } from "./api";
import { getElement } from "./dom";
import type { LoadState } from "./state";

type ProjectWithReviews = Project & { reviews: Review[] };

export function renderDeveloperView(root: HTMLElement): void {
  root.innerHTML = `
    <header>
      <h1>Dotly</h1>
      <p>Projects and reviews</p>
    </header>
    <form id="project-form">
      <label for="project-name">Project name</label>
      <input id="project-name" name="name" required maxlength="100" />
      <button type="submit">Create project</button>
      <p id="project-message" role="alert"></p>
    </form>
    <section id="projects" aria-label="Projects" aria-live="polite"></section>
  `;

  const projectList = getElement<HTMLElement>("#projects");
  const projectForm = getElement<HTMLFormElement>("#project-form");
  const projectName = getElement<HTMLInputElement>("#project-name");
  const projectButton = getElement<HTMLButtonElement>("#project-form button");
  const projectMessage = getElement<HTMLParagraphElement>("#project-message");
  let projectsState: LoadState<ProjectWithReviews[]> = { status: "idle" };

  function renderProjects(): void {
    projectList.replaceChildren();
    const state = projectsState;

    switch (state.status) {
      case "idle":
        return;
      case "loading":
        projectList.textContent = "Loading projects…";
        return;
      case "error": {
        const message = document.createElement("p");
        message.setAttribute("role", "alert");
        message.textContent = state.error.message;
        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "Try again";
        retry.addEventListener("click", loadProjects);
        projectList.append(message, retry);
        return;
      }
      case "success":
        if (state.data.length === 0) {
          projectList.textContent = "No projects yet. Create your first project above.";
        }
        for (const project of state.data) {
          projectList.append(createProjectCard(project));
        }
        return;
      default: {
        const unreachable: never = state;
        throw new Error(`Unknown project state: ${unreachable}`);
      }
    }
  }

  async function loadProjects(): Promise<void> {
    projectsState = { status: "loading" };
    renderProjects();
    try {
      const projects = await fetchJson<Project[]>("/api/projects");
      const data = await Promise.all(projects.map(async (project) => ({
        ...project,
        reviews: await fetchJson<Review[]>(`/api/projects/${encodeURIComponent(project.id)}/reviews`),
      })));
      projectsState = { status: "success", data };
    } catch (error) {
      projectsState = {
        status: "error",
        error: error instanceof Error ? error : new Error("Could not load projects."),
      };
    }
    renderProjects();
  }

  projectForm.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    if (projectButton.disabled) return;
    projectButton.disabled = true;
    projectMessage.textContent = "";
    try {
      await fetchJson<Project>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.value.trim() }),
      });
      projectForm.reset();
      await loadProjects();
    } catch (error) {
      projectMessage.textContent = error instanceof ApiError && error.code === "VALIDATION_ERROR"
        ? "Enter a project name between 1 and 100 characters."
        : error instanceof Error ? error.message : "Could not create project.";
    } finally {
      projectButton.disabled = false;
    }
  });

  void loadProjects();
}

function createProjectCard(project: ProjectWithReviews): HTMLElement {
  const card = document.createElement("article");
  card.className = "project-card";
  const heading = document.createElement("h2");
  heading.textContent = project.name;
  const emptyMessage = document.createElement("p");
  emptyMessage.textContent = "No reviews yet.";
  emptyMessage.hidden = project.reviews.length > 0;
  const list = document.createElement("ul");
  list.className = "review-list";
  for (const review of project.reviews) {
    list.append(renderReview(review));
  }

  const form = document.createElement("form");
  const label = document.createElement("label");
  label.textContent = "Page URL";
  const input = document.createElement("input");
  input.name = "url";
  input.inputMode = "url";
  input.placeholder = "https://example.com";
  input.required = true;
  label.append(input);
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Create review";
  const message = document.createElement("p");
  message.setAttribute("role", "status");
  form.append(label, button, message);
  card.append(heading, emptyMessage, list, form);
  let reviewState: LoadState<Review> = { status: "idle" };

  function renderReviewState(): void {
    const state = reviewState;
    input.disabled = state.status === "loading";
    button.disabled = state.status === "loading";
    button.textContent = state.status === "loading" ? "Capturing screenshot…" : "Create review";

    switch (state.status) {
      case "idle":
        message.textContent = "";
        return;
      case "loading":
        message.textContent = "Capturing screenshot…";
        return;
      case "success":
        message.textContent = "Review created.";
        return;
      case "error":
        message.textContent = state.error.message;
        return;
      default: {
        const unreachable: never = state;
        throw new Error(`Unknown review state: ${unreachable}`);
      }
    }
  }

  form.addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    if (reviewState.status === "loading") return;
    const url = input.value.trim();
    reviewState = { status: "loading" };
    renderReviewState();
    try {
      const review = await fetchJson<Review>(`/api/projects/${encodeURIComponent(project.id)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      list.prepend(renderReview(review));
      emptyMessage.hidden = true;
      form.reset();
      reviewState = { status: "success", data: review };
    } catch (error) {
      reviewState = {
        status: "error",
        error: error instanceof ApiError && error.code === "VALIDATION_ERROR"
          ? new Error("Enter a valid http:// or https:// address.")
          : error instanceof Error ? error : new Error("Could not create review."),
      };
    }
    renderReviewState();
  });

  return card;
}

function renderReview(review: Review): HTMLLIElement {
  const item = document.createElement("li");
  const url = document.createElement("p");
  url.className = "review-url";
  url.textContent = review.url;
  const status = document.createElement("span");
  status.className = `review-status status-${review.status}`;
  item.append(url, status);

  switch (review.status) {
    case "ready": {
      status.textContent = "Ready";
      const link = document.createElement("a");
      link.href = `?review=${encodeURIComponent(review.id)}`;
      link.textContent = "Open review";
      item.append(" ", link);
      break;
    }
    case "pending":
      status.textContent = "Capturing screenshot…";
      break;
    case "failed": {
      status.textContent = "Failed";
      const error = document.createElement("p");
      error.textContent = review.errorMessage;
      item.append(error);
      break;
    }
    default: {
      const unreachable: never = review;
      throw new Error(`Unknown review status: ${unreachable}`);
    }
  }
  return item;
}
