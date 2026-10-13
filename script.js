const button = document.querySelector('.menu-button');
const links = document.querySelector('.nav-links');
const pageRoot = document.documentElement;

pageRoot.classList.add('js-enabled');

button.addEventListener('click', () => {
  const isOpen = links.classList.toggle('open');
  button.setAttribute('aria-expanded', isOpen);
});

links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  links.classList.remove('open');
  button.setAttribute('aria-expanded', 'false');
}));

const themeButtons = document.querySelectorAll('[data-theme-choice]');
const savedTheme = localStorage.getItem('signum-vitae-theme');

function setTheme(theme) {
  pageRoot.dataset.theme = theme;
  localStorage.setItem('signum-vitae-theme', theme);
  themeButtons.forEach((themeButton) => {
    const isActive = themeButton.dataset.themeChoice === theme;
    themeButton.classList.toggle('is-active', isActive);
    themeButton.setAttribute('aria-pressed', isActive);
  });
}

setTheme(savedTheme === 'dark' ? 'dark' : 'light');
themeButtons.forEach((themeButton) => themeButton.addEventListener('click', () => setTheme(themeButton.dataset.themeChoice)));

const progress = document.querySelector('.scroll-progress span');
const updateProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progressValue = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  progress.style.width = `${progressValue}%`;
};

const sections = [...document.querySelectorAll('main section')];
sections.forEach((section) => section.classList.add('reveal'));

const navigationLinks = [...links.querySelectorAll('a')];
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  sections.forEach((section) => revealObserver.observe(section));

  const navigationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigationLinks.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('is-current', isCurrent);
        if (isCurrent) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

  sections.forEach((section) => navigationObserver.observe(section));
} else {
  sections.forEach((section) => section.classList.add('is-visible'));
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();
