let paused = false;
let intensity = 'mild'; // mild | medium | high
let currentTaskIndex = 0;
let animationTimerId = null;

const totalTasks = 4;
const taskDurationHint = 'Take your time. The full simulation usually takes about 2–3 minutes.';

const intensityMap = {
  mild: { tickMs: 260, amp: 1.2, chance: 0.06 },
  medium: { tickMs: 180, amp: 2.1, chance: 0.11 },
  high: { tickMs: 120, amp: 3.2, chance: 0.17 }
};

const lineTaskState = {
  target: 37,
  value: 50,
  dragging: false,
  markerDriftPx: 0,
  lineShiftX: 0
};

let simTaskAreaEl;
let taskProgressEl;
let reflectionEl;
let pauseBtnEl;
let resetBtnEl;
let intensitySelectEl;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function renderProgress() {
  if (!taskProgressEl) return;
  taskProgressEl.textContent = currentTaskIndex < totalTasks
    ? `Task ${currentTaskIndex + 1} of ${totalTasks} · ${taskDurationHint}`
    : 'Reflection';
}

function clearTaskEffects() {
  const unstableEls = simTaskAreaEl.querySelectorAll('.unstable-number, .unstable-expression, .unstable-dots, .number-line-shell, .line-marker');
  unstableEls.forEach((el) => {
    el.style.transform = '';
    el.style.filter = '';
    el.style.opacity = '';
    el.style.gap = '';
  });
  const ticks = simTaskAreaEl.querySelectorAll('.number-line-tick');
  ticks.forEach((tick) => {
    tick.style.opacity = '';
  });
}

function updatePauseUI() {
  if (!pauseBtnEl) return;
  pauseBtnEl.textContent = paused ? 'Resume' : 'Pause';
}

function setPaused(nextPaused) {
  paused = !!nextPaused;
  updatePauseUI();
  if (paused) {
    clearTaskEffects();
  }
}

function setIntensity(level) {
  if (!intensityMap[level]) return;
  intensity = level;
  restartAnimationLoop();
}

function resetSimulation() {
  currentTaskIndex = 0;
  paused = false;
  lineTaskState.value = 50;
  lineTaskState.dragging = false;
  lineTaskState.markerDriftPx = 0;
  lineTaskState.lineShiftX = 0;
  if (reflectionEl) reflectionEl.hidden = true;
  updatePauseUI();
  renderTask();
  restartAnimationLoop();
}

function nextTask() {
  currentTaskIndex += 1;
  if (currentTaskIndex >= totalTasks) {
    showReflection();
    return;
  }
  renderTask();
}

function showReflection() {
  if (!simTaskAreaEl || !reflectionEl) return;
  simTaskAreaEl.innerHTML = `
    <div class="dyscalc-task-card">
      <h3>Simulation complete</h3>
      <p>You have reached the end of the tasks.</p>
      <button id="restartFromReflectionBtn" type="button" class="cta-button">Try Again</button>
    </div>
  `;
  reflectionEl.hidden = false;
  renderProgress();
  const restartBtn = document.getElementById('restartFromReflectionBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', resetSimulation);
  }
}

function renderTask() {
  if (!simTaskAreaEl) return;
  if (reflectionEl) reflectionEl.hidden = true;
  renderProgress();

  switch (currentTaskIndex) {
    case 0:
      renderNumberComparisonTask();
      break;
    case 1:
      renderSymbolInstabilityTask();
      break;
    case 2:
      renderQuantityMatchingTask();
      break;
    case 3:
      renderNumberLineTask();
      break;
    default:
      showReflection();
  }
}

function renderNumberComparisonTask() {
  const pair = [7, 9];
  simTaskAreaEl.innerHTML = `
    <div class="dyscalc-task-card" data-task="compare">
      <h3>Number Comparison</h3>
      <p>Which number is larger?</p>
      <div class="compare-row">
        <button type="button" class="dyscalc-option-btn unstable-number" data-value="${pair[0]}">${pair[0]}</button>
        <button type="button" class="dyscalc-option-btn unstable-number" data-value="${pair[1]}">${pair[1]}</button>
      </div>
      <p class="task-feedback" id="taskFeedback">Select one option.</p>
      <button type="button" class="cta-button" id="nextTaskBtn" disabled>Next Task</button>
    </div>
  `;

  const buttons = simTaskAreaEl.querySelectorAll('.dyscalc-option-btn');
  const feedback = document.getElementById('taskFeedback');
  const nextBtn = document.getElementById('nextTaskBtn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const chosen = Number(btn.dataset.value);
      const isCorrect = chosen === Math.max(...pair);
      if (feedback) {
        feedback.textContent = isCorrect
          ? 'You picked the larger number.'
          : 'This choice is understandable under instability. Review and continue when ready.';
      }
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  if (nextBtn) nextBtn.addEventListener('click', nextTask);
}

function renderSymbolInstabilityTask() {
  simTaskAreaEl.innerHTML = `
    <div class="dyscalc-task-card" data-task="symbol">
      <h3>Symbol Instability</h3>
      <p>Read the expression and choose the operation you think is shown.</p>
      <div class="symbol-expression unstable-expression" aria-live="polite">
        <span>12</span>
        <span id="operatorEl" class="operator">+</span>
        <span>8</span>
      </div>
      <div class="symbol-options">
        <button type="button" class="dyscalc-option-btn" data-op="+">Addition (+)</button>
        <button type="button" class="dyscalc-option-btn" data-op="-">Subtraction (-)</button>
        <button type="button" class="dyscalc-option-btn" data-op="×">Multiplication (×)</button>
      </div>
      <p class="task-feedback" id="taskFeedback">The intended symbol is addition (+), but it may briefly appear different.</p>
      <button type="button" class="cta-button" id="nextTaskBtn">Next Task</button>
    </div>
  `;

  const buttons = simTaskAreaEl.querySelectorAll('.dyscalc-option-btn');
  const feedback = document.getElementById('taskFeedback');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const op = btn.dataset.op;
      if (feedback) {
        feedback.textContent = op === '+'
          ? 'You selected addition. The core problem is still simple, but the symbol can feel unreliable.'
          : 'That hesitation is part of the simulation: symbols can momentarily look different.';
      }
    });
  });

  const nextBtn = document.getElementById('nextTaskBtn');
  if (nextBtn) nextBtn.addEventListener('click', nextTask);
}

function createDotGroup(count) {
  const group = document.createElement('button');
  group.type = 'button';
  group.className = 'dot-group unstable-dots';
  group.dataset.count = String(count);
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    group.appendChild(dot);
  }
  return group;
}

function renderQuantityMatchingTask() {
  const target = 6;
  const choices = [5, 6, 7];
  simTaskAreaEl.innerHTML = `
    <div class="dyscalc-task-card" data-task="quantity">
      <h3>Quantity Matching</h3>
      <p>Which group represents <strong>${target}</strong>?</p>
      <div class="dot-groups" id="dotGroups"></div>
      <p class="task-feedback" id="taskFeedback">Select the group that matches the target quantity.</p>
      <button type="button" class="cta-button" id="nextTaskBtn" disabled>Next Task</button>
    </div>
  `;

  const groupsEl = document.getElementById('dotGroups');
  const feedback = document.getElementById('taskFeedback');
  const nextBtn = document.getElementById('nextTaskBtn');
  if (!groupsEl) return;

  const groups = choices.map((count) => createDotGroup(count));
  groups.forEach((group) => groupsEl.appendChild(group));

  groups.forEach((group) => {
    group.addEventListener('click', () => {
      groups.forEach((g) => g.classList.remove('selected'));
      group.classList.add('selected');
      const selectedCount = Number(group.dataset.count);
      const isCorrect = selectedCount === target;
      if (feedback) {
        feedback.textContent = isCorrect
          ? 'You matched the quantity.'
          : 'This mismatch reflects how quantity can feel less stable under visual uncertainty.';
      }
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  if (nextBtn) nextBtn.addEventListener('click', nextTask);
}

function renderNumberLineTask() {
  lineTaskState.target = 37;
  lineTaskState.value = 50;
  lineTaskState.dragging = false;
  lineTaskState.markerDriftPx = 0;
  lineTaskState.lineShiftX = 0;

  simTaskAreaEl.innerHTML = `
    <div class="dyscalc-task-card" data-task="line">
      <h3>Number Line Placement</h3>
      <p>Place the marker at <strong>${lineTaskState.target}</strong> on the number line (0 to 100).</p>
      <div class="number-line-shell" id="numberLineShell">
        <div class="number-line" id="numberLine">
          <div class="number-line-track"></div>
          <div class="number-line-ticks" id="numberLineTicks"></div>
          <button type="button" class="line-marker" id="lineMarker" aria-label="Draggable number marker"></button>
        </div>
      </div>
      <p class="task-feedback" id="lineReadout">Current placement: 50</p>
      <button type="button" class="cta-button" id="finishTaskBtn">Finish Simulation</button>
    </div>
  `;

  const line = document.getElementById('numberLine');
  const marker = document.getElementById('lineMarker');
  const ticks = document.getElementById('numberLineTicks');
  const readout = document.getElementById('lineReadout');
  const finishBtn = document.getElementById('finishTaskBtn');

  if (!line || !marker || !ticks) return;

  for (let i = 0; i <= 100; i += 10) {
    const tick = document.createElement('span');
    tick.className = 'number-line-tick';
    tick.style.left = `${i}%`;
    tick.textContent = i === 0 || i === 50 || i === 100 ? String(i) : '';
    ticks.appendChild(tick);
  }

  function updateMarkerVisual() {
    marker.style.left = `${lineTaskState.value}%`;
    marker.style.transform = `translateX(calc(-50% + ${lineTaskState.markerDriftPx}px))`;
    if (readout) {
      readout.textContent = `Current placement: ${Math.round(lineTaskState.value)}`;
    }
  }

  function placeFromPointer(clientX) {
    const rect = line.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    lineTaskState.value = ratio * 100;
    updateMarkerVisual();
  }

  function pointerDown(event) {
    lineTaskState.dragging = true;
    placeFromPointer(event.clientX);
  }

  function pointerMove(event) {
    if (!lineTaskState.dragging) return;
    placeFromPointer(event.clientX);
  }

  function pointerUp() {
    lineTaskState.dragging = false;
  }

  line.addEventListener('pointerdown', pointerDown);
  window.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);
  updateMarkerVisual();

  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      showReflection();
    });
  }
}

function applyDistortionEffects() {
  if (paused || !simTaskAreaEl) return;

  const settings = intensityMap[intensity] || intensityMap.mild;
  const amp = settings.amp;
  const chance = settings.chance;
  const taskName = simTaskAreaEl.querySelector('.dyscalc-task-card')?.dataset.task;

  if (taskName === 'compare') {
    const nums = simTaskAreaEl.querySelectorAll('.unstable-number');
    nums.forEach((num) => {
      const x = randBetween(-amp, amp);
      const y = randBetween(-amp * 0.6, amp * 0.6);
      const scale = randBetween(0.98, 1.04);
      const blur = randBetween(0, amp * 0.25);
      const fade = randBetween(0.86, 1);
      num.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      num.style.filter = `blur(${blur}px)`;
      num.style.opacity = `${fade}`;
    });
  }

  if (taskName === 'symbol') {
    const operatorEl = document.getElementById('operatorEl');
    const expression = simTaskAreaEl.querySelector('.unstable-expression');
    if (expression) {
      expression.style.transform = `translate(${randBetween(-amp, amp)}px, ${randBetween(-amp * 0.3, amp * 0.3)}px)`;
    }

    if (operatorEl && Math.random() < chance) {
      const alternatives = ['×', '−'];
      const original = '+';
      operatorEl.textContent = alternatives[Math.floor(Math.random() * alternatives.length)];
      operatorEl.style.opacity = '0.88';
      setTimeout(() => {
        operatorEl.textContent = original;
        operatorEl.style.opacity = '1';
      }, clamp(130 + amp * 20, 130, 230));
    }
  }

  if (taskName === 'quantity') {
    const groups = simTaskAreaEl.querySelectorAll('.unstable-dots');
    groups.forEach((group) => {
      group.style.transform = `translate(${randBetween(-amp, amp)}px, ${randBetween(-amp * 0.5, amp * 0.5)}px)`;
      group.style.gap = `${randBetween(5, 8 + amp)}px`;
      group.style.opacity = `${randBetween(0.9, 1)}`;
    });
  }

  if (taskName === 'line') {
    const shell = document.getElementById('numberLineShell');
    const ticks = simTaskAreaEl.querySelectorAll('.number-line-tick');
    const marker = document.getElementById('lineMarker');

    if (shell) {
      lineTaskState.lineShiftX = randBetween(-amp, amp);
      shell.style.transform = `translateX(${lineTaskState.lineShiftX}px)`;
    }

    ticks.forEach((tick) => {
      if (Math.random() < chance * 0.8) {
        tick.style.opacity = `${randBetween(0.5, 1)}`;
      }
    });

    if (marker && lineTaskState.dragging && Math.random() < chance) {
      lineTaskState.markerDriftPx = randBetween(-amp * 1.1, amp * 1.1);
      marker.style.transform = `translateX(calc(-50% + ${lineTaskState.markerDriftPx}px))`;
    }
  }
}

function restartAnimationLoop() {
  if (animationTimerId) {
    clearInterval(animationTimerId);
    animationTimerId = null;
  }
  const tickMs = (intensityMap[intensity] || intensityMap.mild).tickMs;
  animationTimerId = setInterval(applyDistortionEffects, tickMs);
}

function setupControls() {
  pauseBtnEl = document.getElementById('pauseBtn');
  resetBtnEl = document.getElementById('resetBtn');
  intensitySelectEl = document.getElementById('intensitySelect');

  if (pauseBtnEl) {
    pauseBtnEl.addEventListener('click', () => {
      setPaused(!paused);
    });
  }

  if (resetBtnEl) {
    resetBtnEl.addEventListener('click', resetSimulation);
  }

  if (intensitySelectEl) {
    intensitySelectEl.value = intensity;
    intensitySelectEl.addEventListener('change', (event) => {
      setIntensity(event.target.value);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  simTaskAreaEl = document.getElementById('simTaskArea');
  taskProgressEl = document.getElementById('taskProgress');
  reflectionEl = document.getElementById('reflectionCard');

  if (!simTaskAreaEl) return;

  setupControls();
  renderTask();
  restartAnimationLoop();
  updatePauseUI();
});
