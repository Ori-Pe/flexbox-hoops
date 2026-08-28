import { LEVELS } from './levels.js';

const RING_COLORS = ['#f4822a', '#29aaed', '#2dcfb3', '#7c3aed'];

const state = {
  levelIndex: 0,
};

let els = {};

function ringColor(index) {
  return RING_COLORS[index % RING_COLORS.length];
}

function solutionStyles(level) {
  return {
    containerStyle: { ...level.base, ...(level.solution.container || {}) },
    itemStyles: { ...(level.solution.items || {}) },
  };
}

function createBall(index) {
  const el = document.createElement('div');
  el.className = 'ball';
  el.style.setProperty('--ring-color', ringColor(index));
  return el;
}

function createBasket(index) {
  const el = document.createElement('div');
  el.className = 'basket';
  el.style.setProperty('--ring-color', ringColor(index));
  el.innerHTML = `
    <div class="basket__backboard"></div>
    <div class="basket__rim"></div>
    <div class="basket__net"></div>
  `;
  return el;
}

function applyContainerStyle(layerEl, style) {
  layerEl.removeAttribute('style');
  Object.assign(layerEl.style, style);
}

function applyItemStyle(itemEl, style) {
  for (const [prop, value] of Object.entries(style)) {
    itemEl.style[prop] = value;
  }
}

function renderLevelNav() {
  els.levelNav.innerHTML = '';
  LEVELS.forEach((level, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'level-chip';
    chip.textContent = String(index + 1);
    chip.title = level.title;
    if (index === state.levelIndex) chip.classList.add('level-chip--current');
    chip.addEventListener('click', () => goToLevel(index));
    els.levelNav.appendChild(chip);
  });
}

function renderBasketLayer(level) {
  els.basketLayer.innerHTML = '';
  const { containerStyle, itemStyles } = solutionStyles(level);
  applyContainerStyle(els.basketLayer, containerStyle);
  for (let i = 0; i < level.ballCount; i++) {
    const basket = createBasket(i);
    if (itemStyles[i]) applyItemStyle(basket, itemStyles[i]);
    els.basketLayer.appendChild(basket);
  }
}

function renderBallLayer(level) {
  els.ballLayer.innerHTML = '';
  applyContainerStyle(els.ballLayer, { ...level.base });
  for (let i = 0; i < level.ballCount; i++) {
    els.ballLayer.appendChild(createBall(i));
  }
}

function renderObjective(level) {
  els.objectiveText.textContent = level.goal;
  els.hintText.textContent = level.hint;
  els.hintText.hidden = true;
  els.hintToggle.textContent = 'Show hint';
}

function renderLevelIndicator() {
  els.levelIndicator.textContent = `Level ${state.levelIndex + 1} of ${LEVELS.length}`;
}

function renderLevel() {
  const level = LEVELS[state.levelIndex];
  renderBasketLayer(level);
  renderBallLayer(level);
  renderObjective(level);
  renderLevelIndicator();
  renderLevelNav();
  els.successOverlay.hidden = true;
}

function goToLevel(index) {
  state.levelIndex = index;
  renderLevel();
}

export function init(root) {
  els = {
    levelIndicator: root.querySelector('#level-indicator'),
    levelNav: root.querySelector('#level-nav'),
    basketLayer: root.querySelector('#basket-layer'),
    ballLayer: root.querySelector('#ball-layer'),
    objectiveText: root.querySelector('#objective-text'),
    hintText: root.querySelector('#hint-text'),
    hintToggle: root.querySelector('#hint-toggle'),
    successOverlay: root.querySelector('#success-overlay'),
  };

  els.hintToggle.addEventListener('click', () => {
    els.hintText.hidden = !els.hintText.hidden;
    els.hintToggle.textContent = els.hintText.hidden ? 'Show hint' : 'Hide hint';
  });

  renderLevel();
}
