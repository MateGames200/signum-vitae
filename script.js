const button = document.querySelector('.menu-button');
const links = document.querySelector('.nav-links');

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
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('signum-vitae-theme', theme);
  themeButtons.forEach((themeButton) => {
    const isActive = themeButton.dataset.themeChoice === theme;
    themeButton.classList.toggle('is-active', isActive);
    themeButton.setAttribute('aria-pressed', isActive);
  });
}

setTheme(savedTheme === 'dark' ? 'dark' : 'light');
themeButtons.forEach((themeButton) => themeButton.addEventListener('click', () => setTheme(themeButton.dataset.themeChoice)));
