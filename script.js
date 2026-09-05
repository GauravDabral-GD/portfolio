let CONTENT = {};
let ASSETS = {};

let PROJECTS = {
  professional: {},
  personal: {},
};

// Load portfolio content.
async function loadContent() {
  try {
    const response = await fetch("content.json");

    if (!response.ok) {
      throw new Error("Failed to load content.json");
    }

    CONTENT = await response.json();
    return CONTENT;
  } catch (error) {
    console.error("Failed to load content.json:", error);
    return {};
  }
}

// Load portfolio assets.
async function loadAssets() {
  try {
    const response = await fetch("assets.json");

    if (!response.ok) {
      throw new Error("Failed to load assets.json");
    }

    ASSETS = await response.json();
    return ASSETS;
  } catch (error) {
    console.error("Failed to load assets.json:", error);
    return {};
  }
}

// Resolve an asset.
function resolveAsset(section, key, fallback = "") {
  return ASSETS?.[section]?.[key] || fallback;
}

// Build project data from content.
function buildProjects() {
  PROJECTS = {
    professional: {},
    personal: {},
  };

  Object.entries(CONTENT.professionalProjects || {}).forEach(
    ([key, project]) => {
      PROJECTS.professional[key] = {
        ...project,
        video: project.video || "",
        images: Array.isArray(project.images)
          ? project.images.filter(Boolean)
          : [],
        galleryCount: 4,
      };
    },
  );

  Object.entries(CONTENT.personalProjects || {}).forEach(([key, project]) => {
    PROJECTS.personal[key] = {
      ...project,
      video: project.video || "",
      images: Array.isArray(project.images)
        ? project.images.filter(Boolean)
        : [],
      galleryCount: 4,
    };
  });
}

// Apply general site content.
function applySiteContent() {
  const site = CONTENT.site;

  if (!site) return;

  document.title = site.pageTitle;

  document.querySelectorAll('[data-name="author"]').forEach((element) => {
    element.textContent = site.authorName;
  });

  document.querySelectorAll("[data-content]").forEach((element) => {
    const key = element.dataset.content;

    const value = getNestedValue(site, key);

    if (value !== undefined) {
      element.textContent = value;
    }
  });
}

// Get nested content value.
function getNestedValue(object, path) {
  return path.split(".").reduce((current, key) => current?.[key], object);
}

// Render project tiles.
function renderProjectTiles() {
  const professionalGrid = document.getElementById("professionalGrid");

  const personalGrid = document.getElementById("personalGrid");

  if (professionalGrid) {
    professionalGrid.innerHTML = "";

    Object.entries(PROJECTS.professional).forEach(([key, project]) => {
      professionalGrid.insertAdjacentHTML(
        "beforeend",
        createProjectTile(key, project, "professional"),
      );
    });
  }

  if (personalGrid) {
    personalGrid.innerHTML = "";

    Object.entries(PROJECTS.personal).forEach(([key, project]) => {
      personalGrid.insertAdjacentHTML(
        "beforeend",
        createProjectTile(key, project, "personal"),
      );
    });
  }

  bindProjectTiles();
}

function createLockIcon() {
  return `
    <svg class="lock-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M22 30V20c0-5.5 4.5-10 10-10s10 4.5 10 10v10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <rect x="18" y="28" width="28" height="23" rx="5" fill="none" stroke="currentColor" stroke-width="3"/>
      <circle cx="32" cy="39.5" r="3.5" fill="currentColor"/>
      <path d="M32 43v5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `;
}

// Create a project tile.
function createProjectTile(key, project, section) {
  const previewImage = project.images?.[0] || "";

  const tileImageMarkup = previewImage
    ? `
        <div
          class="tile__img"
          style="
            background-image: url('${previewImage}');
            background-size: cover;
            background-position: center;
          ">
        </div>
      `
    : `
        <div class="tile__img tile__img--locked">
          ${createLockIcon()}
        </div>
      `;

  return `
    <article
      class="tile"
      tabindex="0"
      data-project-section="${section}"
      data-target="${key}">

      ${tileImageMarkup}

      <div class="tile__body">

        <h3>
          ${project.title}
        </h3>

        <div class="tags">

          ${project.tags.map((tag) => `<span>${tag}</span>`).join("")}

        </div>

        <p>
          ${project.shortDescription}
        </p>

      </div>

    </article>
  `;
}

// Bind project tile interactions.
function bindProjectTiles() {
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      openProjectModal(tile.dataset.projectSection, tile.dataset.target);
    });

    tile.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        openProjectModal(tile.dataset.projectSection, tile.dataset.target);
      }
    });
  });
}

// Apply author name.
function applyAuthorName() {
  const name = CONTENT.site?.authorName || "Gaurav Dabral";

  document.querySelectorAll('[data-name="author"]').forEach((element) => {
    element.textContent = name;
  });

  document.title =
    CONTENT.site?.pageTitle || `${name} — Game Programming & Design Portfolio`;
}

// Mobile navigation.
const sidenav = document.getElementById("sidenav");

const navtoggle = document.getElementById("navtoggle");

const sidenavBackdrop = document.getElementById("sidenavBackdrop");

function openNav() {
  sidenav.classList.add("open");

  document.body.classList.add("nav-open");
}

function closeNav() {
  sidenav.classList.remove("open");

  document.body.classList.remove("nav-open");
}

navtoggle.addEventListener("click", () => {
  sidenav.classList.contains("open") ? closeNav() : openNav();
});

sidenavBackdrop.addEventListener("click", closeNav);

// Scroll spy.
const sections = document.querySelectorAll(".section[id]");

const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const id = entry.target.getAttribute("id");

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
      });
    });
  },
  {
    rootMargin: "-40% 0px -55% 0px",
  },
);

sections.forEach((section) => spyObserver.observe(section));

// Modal.
const modal = document.getElementById("modal");

const modalPanel = document.getElementById("modalPanel");

const modalContent = document.getElementById("modalContent");

const modalClose = document.getElementById("modalClose");

function openModal({ wide = false } = {}) {
  modalPanel.classList.toggle("wide", wide);

  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");

  modalContent.querySelectorAll("video").forEach((video) => {
    video.pause();
  });
}

// Open project modal.
function openProjectModal(section, key) {
  const project = PROJECTS?.[section]?.[key];

  if (!project) return;

  const labels = CONTENT.site.projectModal;

  const gallerySlots = project.images.length
    ? project.images
      .map(
        (source) => `
            <img
              src="${source}"
              alt="${project.title} screenshot"
              class="modal__gallery-img">
          `,
      )
      .join("")
    : `
        <div class="modal__gallery-placeholder modal__gallery-placeholder--locked">
          ${createLockIcon()}
        </div>
      `;

  const technology = project.technology?.length
    ? `
        <p class="modal__section-label">
          ${labels.technologyLabel}
        </p>

        <div class="tags">

          ${project.technology.map((item) => `<span>${item}</span>`).join("")}

        </div>
      `
    : "";

  const video = project.video
    ? `
        <video
          class="modal__video"
          controls
          preload="metadata"
          playsinline>

          <source
            src="${project.video}"
            type="video/mp4">

          Your browser doesn't support
          embedded video.

        </video>
      `
    : "";

  modalContent.innerHTML = `

    <h3>
      ${project.title}
    </h3>

    <p class="lead">
      ${project.description}
    </p>

    ${technology}

    ${video}

    <p class="modal__section-label">
      ${labels.galleryLabel}
    </p>

    <div class="modal__gallery">
      ${gallerySlots}
    </div>

    <p class="modal__section-label">
      ${labels.contributionsLabel}
    </p>

    <ul>

      ${project.contributions.map((item) => `<li>${item}</li>`).join("")}

    </ul>

  `;

  openModal({
    wide: true,
  });
}

// Resume.
function openResumeModal() {
  const resumePath = ASSETS.resumePdf || "resume.pdf";

  const resume = CONTENT.site.resume;

  modalContent.innerHTML = `

    <h3>
      ${resume.title}
    </h3>

    <iframe
      class="resume__frame"
      src="${resumePath}"
      title="${resume.title} preview">
    </iframe>

    <div class="resume__actions">

      <a
        class="btn btn--accent"
        href="${resumePath}"
        download>

        ${resume.downloadButton}

      </a>

      <a
        class="btn"
        href="${resumePath}"
        target="_blank"
        rel="noopener">

        ${resume.openButton}

      </a>

    </div>

    <p
      class="fine-print"
      style="margin-top:1rem;">

      ${resume.fallbackText}
      <code>${resumePath}</code>
      in the project folder.

    </p>

  `;

  openModal({
    wide: true,
  });
}

// Modal controls.
modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

// Resume navigation.
async function setupResumeNavigation() {
  const link = document.getElementById("resumeNavLink");

  if (!link) return;

  link.addEventListener("click", (event) => {
    event.preventDefault();

    closeNav();

    openResumeModal();
  });
}

// Hero video.
function setupHeroVideo() {
  const video = document.getElementById("heroVideo");

  const placeholder = document.getElementById("heroPlaceholder");

  if (!video || !placeholder) return;

  video.src = ASSETS.heroVideo || "reel.mp4";

  video.addEventListener(
    "error",
    () => {
      video.style.display = "none";

      placeholder.classList.add("show");
    },
    true,
  );
}

// Apply text content to HTML.
function renderStaticContent() {
  const site = CONTENT.site;

  document.querySelectorAll("[data-content]").forEach((element) => {
    const value = getNestedValue(site, element.dataset.content);

    if (value !== undefined) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-content-lines]").forEach((element) => {
    const value = getNestedValue(site, element.dataset.contentLines);

    if (!Array.isArray(value)) return;

    element.innerHTML = value
      .map((line) => `<p class="lead">${line}</p>`)
      .join("");
  });

  document.querySelectorAll("[data-href]").forEach((element) => {
    const value = getNestedValue(site, element.dataset.href);

    if (value !== undefined) {
      element.href = value;
    }
  });
}

// Initialize portfolio.
async function initPortfolio() {
  await Promise.all([loadContent(), loadAssets()]);

  buildProjects();

  applyAuthorName();

  renderStaticContent();

  renderProjectTiles();

  setupResumeNavigation();

  setupHeroVideo();
}

// Start.
initPortfolio();
