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
