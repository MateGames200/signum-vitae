const pageRoot = document.documentElement;
const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
const navActions = document.querySelector('.nav-actions');
const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];

pageRoot.classList.add('js-enabled');

function closeMenu() {
  if (!menuButton || !navLinks) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
  navLinks.classList.remove('open');
  navActions?.classList.remove('open');
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
  navLinks?.classList.toggle('open', !isOpen);
  navActions?.classList.toggle('open', !isOpen);
});

navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

function readSavedTheme() {
  try { return localStorage.getItem('signum-vitae-theme'); }
  catch { return null; }
}

function setTheme(theme) {
  pageRoot.dataset.theme = theme;
  try { localStorage.setItem('signum-vitae-theme', theme); } catch { /* Storage may be disabled. */ }
  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeChoice === theme;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#071722' : '#f1f6f8');
}

setTheme(readSavedTheme() === 'dark' ? 'dark' : 'light');
themeButtons.forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));

const progressBar = document.querySelector('.scroll-progress span');
let progressFrame = 0;
function updateProgress() {
  if (!progressBar || progressFrame) return;
  progressFrame = window.requestAnimationFrame(() => {
    const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = pageHeight > 0 ? Math.min(1, window.scrollY / pageHeight) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
    progressFrame = 0;
  });
}
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();

const sections = [...document.querySelectorAll('main > section')];
const revealElements = [
  ...document.querySelectorAll('.flow-step, .team-card'),
];
document.querySelectorAll('.flow-step').forEach((step, index) => {
  step.style.setProperty('--reveal-delay', `${index * 90}ms`);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  revealElements.forEach((element) => {
    element.classList.add('reveal');
    revealObserver.observe(element);
  });

  const navItems = [...(navLinks?.querySelectorAll('a') ?? [])];
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navItems.forEach((link) => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('is-current', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach((section) => navObserver.observe(section));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const nodeFieldPlans = [
  { selectors: ['.hero-copy', '.hero-product', '.hero-foot'] },
  { selectors: ['.section-kicker', '.project-layout h2', '.project-copy', '.flow-heading', '.flow-card', '.trust-panel', '.early-access'] },
  { selectors: ['.section-kicker', '.team-heading', '.team-grid', '.photo-note'] },
];
const nodeFields = [...document.querySelectorAll('[data-node-field]')].map((svg, index) => ({
  svg,
  section: svg.parentElement,
  selectors: nodeFieldPlans[index]?.selectors ?? [],
  edges: [],
  nodes: [],
}));
const pageSeed = Math.floor(Math.random() * 0xffffffff) >>> 0;
const svgNamespace = 'http://www.w3.org/2000/svg';
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(svgNamespace, tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

function pointIsBlocked(x, y, rectangles) {
  return rectangles.some((rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
}

function lineIsBlocked(start, end, rectangles) {
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const samples = Math.max(2, Math.ceil(length / 7));
  for (let sample = 1; sample < samples; sample += 1) {
    const ratio = sample / samples;
    const x = start.x + (end.x - start.x) * ratio;
    const y = start.y + (end.y - start.y) * ratio;
    if (pointIsBlocked(x, y, rectangles)) return true;
  }
  return false;
}

function findIntermediateNodes(start, end, nodes, firstIndex, secondIndex, tolerance) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return [];

  return nodes.flatMap((node, index) => {
    if (index === firstIndex || index === secondIndex) return [];
    const projection = ((node.x - start.x) * dx + (node.y - start.y) * dy) / lengthSquared;
    if (projection <= .14 || projection >= .86) return [];
    const closestX = start.x + projection * dx;
    const closestY = start.y + projection * dy;
    const offset = Math.hypot(node.x - closestX, node.y - closestY);
    return offset <= tolerance ? [{ index, projection, offset }] : [];
  }).sort((first, second) => first.projection - second.projection || first.offset - second.offset);
}

function getFieldObstacles(field, width, height) {
  const sectionRect = field.section.getBoundingClientRect();
  const clearance = window.innerWidth < 600 ? 18 : 20;
  return field.selectors.flatMap((selector) => [...field.section.querySelectorAll(selector)]).map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: clamp(rect.left - sectionRect.left - clearance, 0, width),
      top: clamp(rect.top - sectionRect.top - clearance, 0, height),
      right: clamp(rect.right - sectionRect.left + clearance, 0, width),
      bottom: clamp(rect.bottom - sectionRect.top + clearance, 0, height),
    };
  }).filter((rect) => rect.right > rect.left && rect.bottom > rect.top);
}

function buildNodeField(field, index) {
  const { svg, section } = field;
  const width = Math.round(svg.getBoundingClientRect().width || section.clientWidth);
  const height = Math.round(svg.getBoundingClientRect().height || section.clientHeight);
  if (!width || !height) return;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.replaceChildren();
  field.edges = [];
  field.nodes = [];

  const random = seededRandom((pageSeed + Math.imul(index + 1, 0x9e3779b9)) >>> 0);
  const mobile = window.innerWidth < 600;
  const target = mobile ? 8 : 14;
  const maximumConnections = 5;
  const maxConnectionDistance = mobile ? Math.min(220, width * .48) : 280;
  const nodeMargin = 7;
  const nodesOverlap = (first, second) =>
    Math.hypot(first.x - second.x, first.y - second.y) < first.radius + second.radius + 1.5;
  const obstacles = getFieldObstacles(field, width, height);

  // Scatter nodes independently; only reject points whose visible cores overlap.
  for (let attempt = 0; attempt < target * 700 && field.nodes.length < target; attempt += 1) {
    if (width <= nodeMargin * 2 || height <= nodeMargin * 2) break;
    const node = {
      x: nodeMargin + random() * (width - nodeMargin * 2),
      y: nodeMargin + random() * (height - nodeMargin * 2),
      radius: 2.1 + random() * 1.1,
    };
    if (pointIsBlocked(node.x, node.y, obstacles)) continue;
    if (field.nodes.some((other) => nodesOverlap(other, node))) continue;
    field.nodes.push(node);
  }

  const degree = field.nodes.map(() => 0);
  const hasConnection = (first, second) => field.edges.some((edge) =>
    (edge.first === first && edge.second === second) || (edge.first === second && edge.second === first));
  const addConnection = (first, second, required) => {
    if (hasConnection(first, second)) return true;
    if (degree[first] >= maximumConnections || degree[second] >= maximumConnections) return false;
    field.edges.push({ first, second, required });
    degree[first] += 1;
    degree[second] += 1;
    return true;
  };

  const tryConnect = (first, second, required = false) => {
    if (hasConnection(first, second)) return true;
    const start = field.nodes[first];
    const end = field.nodes[second];
    if (lineIsBlocked(start, end, obstacles)) return false;

    const route = [
      { index: first, point: start },
      ...findIntermediateNodes(start, end, field.nodes, first, second, 10)
        .map(({ index: relayIndex }) => ({ index: relayIndex, point: field.nodes[relayIndex] })),
      { index: second, point: end },
    ];
    const virtualNodes = [];
    const expandedRoute = [];

    for (let segment = 0; segment < route.length - 1; segment += 1) {
      const routeStart = route[segment];
      const routeEnd = route[segment + 1];
      expandedRoute.push(routeStart);
      const distance = Math.hypot(routeEnd.point.x - routeStart.point.x, routeEnd.point.y - routeStart.point.y);
      const steps = Math.ceil(distance / maxConnectionDistance);

      for (let step = 1; step < steps; step += 1) {
        const ratio = step / steps;
        const node = {
          x: routeStart.point.x + (routeEnd.point.x - routeStart.point.x) * ratio,
          y: routeStart.point.y + (routeEnd.point.y - routeStart.point.y) * ratio,
          radius: 2.1 + random() * 1.1,
        };
        const overlapsExisting = field.nodes.some((other) => nodesOverlap(other, node));
        const overlapsRelay = virtualNodes.some((other) => nodesOverlap(other, node));
        if (pointIsBlocked(node.x, node.y, obstacles) || overlapsExisting || overlapsRelay) return false;
        const relayIndex = field.nodes.length + virtualNodes.length;
        virtualNodes.push(node);
        expandedRoute.push({ index: relayIndex, point: node });
      }
    }
    expandedRoute.push(route[route.length - 1]);

    const degreeIncrease = new Map();
    for (let segment = 0; segment < expandedRoute.length - 1; segment += 1) {
      const routeStart = expandedRoute[segment];
      const routeEnd = expandedRoute[segment + 1];
      const distance = Math.hypot(routeEnd.point.x - routeStart.point.x, routeEnd.point.y - routeStart.point.y);
      if (distance > maxConnectionDistance || lineIsBlocked(routeStart.point, routeEnd.point, obstacles)) return false;
      if (hasConnection(routeStart.index, routeEnd.index)) continue;
      degreeIncrease.set(routeStart.index, (degreeIncrease.get(routeStart.index) ?? 0) + 1);
      degreeIncrease.set(routeEnd.index, (degreeIncrease.get(routeEnd.index) ?? 0) + 1);
    }
    for (const [nodeIndex, increase] of degreeIncrease) {
      if ((degree[nodeIndex] ?? 0) + increase > maximumConnections) return false;
    }

    virtualNodes.forEach((node) => {
      field.nodes.push(node);
      degree.push(0);
    });
    for (let segment = 0; segment < expandedRoute.length - 1; segment += 1) {
      addConnection(expandedRoute[segment].index, expandedRoute[segment + 1].index, required);
    }
    return true;
  };

  const candidates = [];
  for (let first = 0; first < field.nodes.length; first += 1) {
    for (let second = first + 1; second < field.nodes.length; second += 1) {
      const distance = Math.hypot(field.nodes[second].x - field.nodes[first].x, field.nodes[second].y - field.nodes[first].y);
      if (distance <= maxConnectionDistance) candidates.push({ first, second, distance });
    }
  }
  candidates.sort((first, second) => first.distance - second.distance);
  candidates.forEach(({ first, second }) => tryConnect(first, second));

  // Give isolated nodes a nearest-neighbor route, adding relays only if needed.
  const originalNodeCount = field.nodes.length;
  for (let nodeIndex = 0; nodeIndex < originalNodeCount; nodeIndex += 1) {
    if (degree[nodeIndex] > 0) continue;
    const neighbors = field.nodes.map((node, index) => ({ index, distance: Math.hypot(node.x - field.nodes[nodeIndex].x, node.y - field.nodes[nodeIndex].y) }))
      .filter(({ index }) => index !== nodeIndex && degree[index] < maximumConnections)
      .sort((first, second) => first.distance - second.distance);
    for (const { index: neighborIndex } of neighbors) {
      if (tryConnect(nodeIndex, neighborIndex, true)) break;
    }
  }

  // Unconnected points with no safe route never enter the rendered graph.
  const retainedNodes = new Set(degree.flatMap((connections, nodeIndex) => connections > 0 ? [nodeIndex] : []));
  const nodeIndexMap = new Map();
  field.nodes = field.nodes.filter((_, nodeIndex) => {
    if (!retainedNodes.has(nodeIndex)) return false;
    nodeIndexMap.set(nodeIndex, nodeIndexMap.size);
    return true;
  });
  field.edges = field.edges.filter((edge) => retainedNodes.has(edge.first) && retainedNodes.has(edge.second)).map((edge) => ({
    ...edge,
    first: nodeIndexMap.get(edge.first),
    second: nodeIndexMap.get(edge.second),
  }));

  field.edges.forEach((edge, edgeIndex) => {
    const { first, second, required } = edge;
    const line = createSvgElement('line', {
      class: `connection${required ? ' is-primary' : ''}`,
      x1: field.nodes[first].x.toFixed(1),
      y1: field.nodes[first].y.toFixed(1),
      x2: field.nodes[second].x.toFixed(1),
      y2: field.nodes[second].y.toFixed(1),
      'data-node-pair': `${first},${second}`,
      opacity: required ? '.09' : '0',
    });
    edge.element = line;
    edge.sequence = edgeIndex;
    svg.append(line);
  });

  field.nodes.forEach((node, nodeIndex) => {
    const group = createSvgElement('g', { class: 'node-group', opacity: 1 });
    group.append(createSvgElement('circle', {
      class: 'node-halo', cx: node.x.toFixed(1), cy: node.y.toFixed(1), r: (node.radius + 4).toFixed(1),
    }));
    group.append(createSvgElement('circle', {
      class: `node-core${nodeIndex % 5 === 2 ? ' is-accent' : ''}`,
      cx: node.x.toFixed(1), cy: node.y.toFixed(1), r: node.radius.toFixed(1),
    }));
    field.nodes[nodeIndex].element = group;
    svg.append(group);
  });
}

function updateNodeFields() {
  nodeFields.forEach((field) => {
    const rect = field.section.getBoundingClientRect();
    const progress = reduceMotion ? 1 : clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
    field.edges.forEach(({ element, required, sequence }) => {
      const threshold = (sequence + 1) / (field.edges.length + 1);
      const active = reduceMotion || progress >= threshold;
      // Keep each pair's link faintly visible, while its brighter connection
      // responds to scroll progress and fades back when the visitor scrolls up.
      const opacity = required ? (active ? '.31' : '.09') : (active ? '.23' : '0');
      element.setAttribute('opacity', opacity);
    });
  });
}

let nodeFieldsReady = false;
let nodeFrame = 0;
function scheduleNodeUpdate() {
  if (nodeFrame) return;
  nodeFrame = window.requestAnimationFrame(() => {
    updateNodeFields();
    nodeFrame = 0;
  });
}

function initializeNodeFields() {
  if (nodeFieldsReady) return;
  nodeFieldsReady = true;
  nodeFields.forEach(buildNodeField);
  scheduleNodeUpdate();
}

initializeNodeFields();

window.addEventListener('scroll', scheduleNodeUpdate, { passive: true });
let nodeResizeFrame = 0;
window.addEventListener('resize', () => {
  if (nodeResizeFrame) return;
  nodeResizeFrame = window.requestAnimationFrame(() => {
    if (nodeFieldsReady) nodeFields.forEach(buildNodeField);
    scheduleNodeUpdate();
    nodeResizeFrame = 0;
  });
}, { passive: true });
