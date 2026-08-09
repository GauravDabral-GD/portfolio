// ---------- Project detail content ----------
// Swap in real project info here. Keyed by the tile's data-target attribute.
// `video`: path to a short clip for this project (leave '' to skip).
// `images`: array of image paths for the gallery (leave [] to show placeholder slots).
// `galleryCount`: how many placeholder slots to show if `images` is empty.
const PROJECTS = {
  'proj-1': {
    title: 'Project Codename Alpha',
    desc: 'Gameplay programmer on a shipped AAA title, focused on narrative systems and scripting tools. Worked cross-discipline with design and audio to get story beats playable in-engine early.',
    items: ['Narrative event scripting system', 'Save/load integration', 'Cross-discipline tooling support', 'Performance pass on scripted sequences'],
    video: 'projects/proj-1/clip.mp4',
    images: [],
    galleryCount: 4
  },
  'proj-2': {
    title: 'Bolt Storm',
    desc: "3D dungeon crawler / shoot 'em up built with a small student team over one semester. I owned combat feel and enemy AI.",
    items: ['Finite state machine in C++', 'Melee + ranged combat system', 'Custom collision checking', 'Build for console target', 'Two-pass stencil shader for outlines'],
    video: 'projects/proj-2/clip.mp4',
    images: [],
    galleryCount: 4
  },
  'proj-3': {
    title: 'Soul Knight',
    desc: '3rd-person adventure platformer with a focus on character feel and a camera that stays out of your way.',
    items: ['Player logic with state machine', 'Advanced follow camera', 'Character behaviour & animation blending', 'Console build & submission'],
    video: 'projects/proj-3/clip.mp4',
    images: [],
    galleryCount: 3
  },
  'proj-4': {
    title: 'Custom Game Engine',
    desc: 'A small engine written from scratch in C++, built to learn the fundamentals end to end — from the render loop up to a usable editor.',
    items: ['Level editor', 'Node-graph scripting system', 'Custom renderer abstraction', 'Hot-reloadable assets'],
    video: 'projects/proj-4/clip.mp4',
    images: [],
    galleryCount: 4
  },
  'proj-5': {
    title: 'Ludum Dare Entry',
    desc: 'A 48-hour game jam project built solo around a single core mechanic, from concept to submission.',
    items: ['Full gameplay design & implementation', 'Rapid prototyping under a time limit', 'Solo art & audio'],
    video: 'projects/proj-5/clip.mp4',
    images: [],
    galleryCount: 3
  },
  'proj-6': {
    title: 'DirectX Renderer',
    desc: 'Physically based rendering renderer built from the ground up in DirectX 11, with an eye toward a clean, engine-agnostic API.',
    items: ['Physically based shading model', 'Abstracted rendering API', 'Input handling with XInput'],
    video: 'projects/proj-6/clip.mp4',
    images: [],
    galleryCount: 4
  }
};

// Where to find the résumé — a preview is shown first, with a download button.
const RESUME_PATH = 'resume.pdf';
const AUTHOR_NAME = 'Gaurav Dabral';

function applyAuthorName() {
  document.querySelectorAll('[data-name="author"]').forEach(el => {
    el.textContent = AUTHOR_NAME;
  });
  document.title = `${AUTHOR_NAME} — Game Programming & Design Portfolio`;
}

applyAuthorName();

// ---------- Mobile nav toggle ----------
const sidenav = document.getElementById('sidenav');
const navtoggle = document.getElementById('navtoggle');
const sidenavBackdrop = document.getElementById('sidenavBackdrop');

function openNav() {
  sidenav.classList.add('open');
  document.body.classList.add('nav-open');
}

function closeNav() {
  sidenav.classList.remove('open');
  document.body.classList.remove('nav-open');
}

navtoggle.addEventListener('click', () => {
  sidenav.classList.contains('open') ? closeNav() : openNav();
});

sidenavBackdrop.addEventListener('click', closeNav);

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', closeNav);
});

// ---------- Scroll-spy active nav link ----------
const sections = document.querySelectorAll('.section[id]');
const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(section => spyObserver.observe(section));

// ---------- Shared modal (projects + résumé) ----------
const modal = document.getElementById('modal');
const modalPanel = document.getElementById('modalPanel');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

function openModal({ wide = false } = {}) {
  modalPanel.classList.toggle('wide', wide);
  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
  // stop any playing video when closing
  modalContent.querySelectorAll('video').forEach(v => v.pause());
}

// ----- Project detail -----
function openProjectModal(key) {
  const data = PROJECTS[key];
  if (!data) return;

  const gallerySlots = data.images.length
    ? data.images.map(src => `<img src="${src}" alt="${data.title} screenshot" class="modal__gallery-img">`).join('')
    : Array.from({ length: data.galleryCount || 3 })
        .map((_, i) => `<div class="modal__gallery-placeholder">Screenshot ${i + 1}<br>(add image)</div>`)
        .join('');

  modalContent.innerHTML = `
    <h3>${data.title}</h3>
    <p>${data.desc}</p>

    <p class="modal__section-label">Clip</p>
    <video class="modal__video" controls preload="none" playsinline>
      <source src="${data.video}" type="video/mp4">
    </video>

    <p class="modal__section-label">Gallery</p>
    <div class="modal__gallery">${gallerySlots}</div>

    <p class="modal__section-label">Contributions</p>
    <ul>${data.items.map(i => `<li>${i}</li>`).join('')}</ul>
  `;

  // Hide the video block entirely if it fails to load (placeholder not added yet)
  const vid = modalContent.querySelector('.modal__video');
  vid.addEventListener('error', () => { vid.style.display = 'none'; }, true);

  openModal({ wide: true });
}

// ----- Résumé preview + download -----
function openResumeModal() {
  modalContent.innerHTML = `
    <h3>Résumé</h3>
    <iframe class="resume__frame" src="${RESUME_PATH}" title="Résumé preview"></iframe>
    <div class="resume__actions">
      <a class="btn btn--accent" href="${RESUME_PATH}" download>Download PDF</a>
      <a class="btn" href="${RESUME_PATH}" target="_blank" rel="noopener">Open in new tab</a>
    </div>
    <p class="fine-print" style="margin-top:1rem;">
      If the preview above is blank, add your file as <code>${RESUME_PATH}</code> in the project folder.
    </p>
  `;
  openModal({ wide: true });
}

document.querySelectorAll('.tile').forEach(tile => {
  tile.addEventListener('click', () => openProjectModal(tile.dataset.target));
  tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openProjectModal(tile.dataset.target);
    }
  });
});

const resumeNavLink = document.getElementById('resumeNavLink');
resumeNavLink.addEventListener('click', (e) => {
  e.preventDefault();
  closeNav();
  openResumeModal();
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ---------- Hero reel fallback ----------
// Shows a friendly placeholder if reel.mp4 hasn't been added yet.
const heroVideo = document.getElementById('heroVideo');
const heroPlaceholder = document.getElementById('heroPlaceholder');

heroVideo.addEventListener('error', () => {
  heroVideo.style.display = 'none';
  heroPlaceholder.classList.add('show');
}, true);
