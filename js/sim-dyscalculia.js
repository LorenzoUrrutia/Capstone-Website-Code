let paused = false;
let intensity = 'mild'; // mild | medium | high
let currentTaskIndex = 0;
let animationTimerId = null;

const totalTasks = 2;
const totalSymbolRounds = 3;
const totalQuantityRounds = 3;
const taskDurationHint = 'Take your time. The full simulation usually takes about 2–3 minutes.';

const intensityMap = {
  mild: { tickMs: 260, amp: 1.2, chance: 0.06 },
  medium: { tickMs: 180, amp: 2.1, chance: 0.11 },
  high: { tickMs: 120, amp: 3.2, chance: 0.17 }
};

let simTaskAreaEl;
let reflectionEl;
let controlBarEl;
let simBackBtnEl;
let simTitleEl;
let simCardEl;
let pauseBtnEl;
let resetBtnEl;
let intensitySelectEl;
let intensityLabelEl;
let symbolRoundIndex = 1;
let quantityRoundIndex = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function toRoman(value) {
  const numerals = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ];

  let remaining = Math.max(1, Math.floor(value));
  let output = '';

  numerals.forEach(([symbol, amount]) => {
    while (remaining >= amount) {
      output += symbol;
      remaining -= amount;
    }
  });

  return output;
}

function evaluateExpression(left, right, op) {
  if (op === '+') return left + right;
  if (op === '-') return left - right;
  return left * right;
}

function buildAnswerChoices(correctValue) {
  const choices = new Set([correctValue]);
  const deltas = [-8, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8];

  while (choices.size < 3) {
    const delta = deltas[Math.floor(Math.random() * deltas.length)];
    const candidate = correctValue + delta;
    if (candidate > 0) choices.add(candidate);
  }

  return Array.from(choices).sort(() => Math.random() - 0.5);
}

function clearTaskEffects() {
  const unstableEls = simTaskAreaEl.querySelectorAll('.unstable-number, .unstable-expression, .unstable-dots, .number-line-shell, .line-marker, .dot');
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
  symbolRoundIndex = 1;
  quantityRoundIndex = 1;
  paused = false;
  if (simTaskAreaEl) {
    simTaskAreaEl.hidden = false;
  }
  if (controlBarEl) {
    controlBarEl.hidden = false;
    controlBarEl.style.display = '';
  }
  if (pauseBtnEl) {
    pauseBtnEl.hidden = false;
    pauseBtnEl.style.display = '';
  }
  if (resetBtnEl) {
    resetBtnEl.hidden = false;
    resetBtnEl.style.display = '';
  }
  if (intensityLabelEl) {
    intensityLabelEl.hidden = false;
    intensityLabelEl.style.display = '';
  }
  if (intensitySelectEl) {
    intensitySelectEl.hidden = false;
    intensitySelectEl.style.display = '';
  }
  if (simBackBtnEl) {
    simBackBtnEl.hidden = false;
  }
  if (reflectionEl) reflectionEl.hidden = true;
  if (simTitleEl) simTitleEl.hidden = false;
  if (simCardEl) simCardEl.hidden = false;
  updatePauseUI();
  renderTask();
  restartAnimationLoop();
}

function advanceSymbolRound() {
  if (symbolRoundIndex < totalSymbolRounds) {
    symbolRoundIndex += 1;
    renderSymbolInstabilityTask();
    return;
  }
  nextTask();
}

function nextTask() {
  currentTaskIndex += 1;
  if (currentTaskIndex >= totalTasks) {
    showReflection();
    return;
  }
  renderTask();
}

function advanceQuantityRound() {
  if (quantityRoundIndex < totalQuantityRounds) {
    quantityRoundIndex += 1;
    renderQuantityMatchingTask();
    return;
  }
  nextTask();
}

function showReflection() {
  if (!simTaskAreaEl || !reflectionEl) return;

  setPaused(true);
  if (animationTimerId) {
    clearInterval(animationTimerId);
    animationTimerId = null;
  }
  simTaskAreaEl.innerHTML = '';
  simTaskAreaEl.hidden = true;

  if (controlBarEl) {
    controlBarEl.hidden = true;
    controlBarEl.style.display = 'none';
  }
  if (pauseBtnEl) {
    pauseBtnEl.hidden = true;
    pauseBtnEl.style.display = 'none';
  }
  if (resetBtnEl) {
    resetBtnEl.hidden = true;
    resetBtnEl.style.display = 'none';
  }
  if (intensityLabelEl) {
    intensityLabelEl.hidden = true;
    intensityLabelEl.style.display = 'none';
  }
  if (intensitySelectEl) {
    intensitySelectEl.hidden = true;
    intensitySelectEl.style.display = 'none';
  }

  if (simBackBtnEl) {
    simBackBtnEl.hidden = false;
  }

  if (reflectionEl) {
    const body = reflectionEl.querySelector('.sim-reflection-body');
    const html = `<p>The shifting numbers and visual changes in this simulation are designed to approximate how numbers and quantities can feel unstable or harder to process. In reality, numbers do not actually move or change, but differences in how the brain processes numerical information can make them feel less consistent or harder to interpret. This is only a simplified representation, and experiences with dyscalculia can vary widely.</p>`;
    if (body) body.innerHTML = html;
    else reflectionEl.innerHTML = `<h3>Reflection</h3><div class="sim-reflection-body">${html}</div>`;
    reflectionEl.hidden = false;
    if (simTitleEl) simTitleEl.hidden = true;
    if (simCardEl) simCardEl.hidden = true;
  }
}

function renderTask() {
  if (!simTaskAreaEl) return;
  if (reflectionEl) reflectionEl.hidden = true;

  switch (currentTaskIndex) {
    case 0:
      renderSymbolInstabilityTask();
      break;
    case 1:
      renderQuantityMatchingTask();
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
  const operatorPool = [
    { symbol: '+', label: 'Addition (+)' },
    { symbol: '-', label: 'Subtraction (-)' },
    { symbol: '×', label: 'Multiplication (×)' }
  ];
  const intendedOp = operatorPool[Math.floor(Math.random() * operatorPool.length)].symbol;

  let leftNum;
  let rightNum;

  if (intendedOp === '-') {
    leftNum = Math.floor(randBetween(12, 29));
    rightNum = Math.floor(randBetween(3, 12));
  } else if (intendedOp === '×') {
    leftNum = Math.floor(randBetween(3, 10));
    rightNum = Math.floor(randBetween(2, 7));
  } else {
    leftNum = Math.floor(randBetween(5, 23));
    rightNum = Math.floor(randBetween(3, 16));
  }

  const correctAnswer = evaluateExpression(leftNum, rightNum, intendedOp);
  const answerChoices = buildAnswerChoices(correctAnswer);
  const leftDisplay = toRoman(leftNum);
  const rightDisplay = toRoman(rightNum);

  simTaskAreaEl.innerHTML = `
    <div class="dyscalc-task-card" data-task="symbol">
      <h3>Symbol Instability</h3>
      <p><strong>Round ${symbolRoundIndex} of ${totalSymbolRounds}</strong></p>
      <p>Read the expression and choose the correct answer.</p>
      <div class="symbol-expression unstable-expression" aria-live="polite">
        <span>${leftDisplay}</span>
        <span id="operatorEl" class="operator" data-original="${intendedOp}">${intendedOp}</span>
        <span>${rightDisplay}</span>
      </div>
      <div class="symbol-options">
        ${answerChoices.map((value) => `<button type="button" class="dyscalc-option-btn" data-answer="${value}">${toRoman(value)}</button>`).join('')}
      </div>
      <p class="task-feedback" id="taskFeedback">The operator may briefly look different. Choose the correct result for the intended expression.</p>
      <button type="button" class="cta-button" id="nextTaskBtn" disabled>${symbolRoundIndex < totalSymbolRounds ? 'Next Round' : 'Next Task'}</button>
    </div>
  `;

  const buttons = simTaskAreaEl.querySelectorAll('.dyscalc-option-btn');
  const feedback = document.getElementById('taskFeedback');
  const nextBtn = document.getElementById('nextTaskBtn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const selectedAnswer = Number(btn.dataset.answer);
      const isCorrect = selectedAnswer === correctAnswer;
      if (feedback) {
        feedback.textContent = isCorrect
          ? `Correct. ${leftDisplay} ${intendedOp} ${rightDisplay} = ${toRoman(correctAnswer)}.`
          : 'Not quite';
      }

      if (nextBtn) nextBtn.disabled = !isCorrect;
    });
  });

  if (nextBtn) nextBtn.addEventListener('click', advanceSymbolRound);
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

function buildQuantityOptions() {
  const highestAdjusted = Math.floor(randBetween(6, 14));
  const targetAdjustedValues = [highestAdjusted, highestAdjusted - 1, highestAdjusted - 1];

  const options = targetAdjustedValues.map((adjusted) => {
    const sign = Math.random() < 0.5 ? 1 : -1;
    const maxMagnitude = sign > 0 ? Math.max(1, adjusted - 1) : 6;
    const magnitude = Math.floor(randBetween(1, Math.min(6, maxMagnitude) + 1));
    const baseCount = adjusted - (sign * magnitude);

    return {
      baseCount,
      sign,
      magnitude,
      adjusted
    };
  });

  return options.sort(() => Math.random() - 0.5);
}

function renderQuantityMatchingTask() {
  const options = buildQuantityOptions();
  const greatest = Math.max(...options.map((o) => o.adjusted));

  simTaskAreaEl.innerHTML = `
    <div class="dyscalc-task-card" data-task="quantity">
      <h3>Quantity Matching</h3>
      <p><strong>Round ${quantityRoundIndex} of ${totalQuantityRounds}</strong></p>
      <p>Each option starts with the dots shown, then applies the Roman numeral modifier. Pick the <strong>greatest resulting quantity</strong>.</p>
      <div class="dot-groups" id="dotGroups"></div>
      <p class="task-feedback" id="taskFeedback">Choose the option with the highest final total.</p>
      <button type="button" class="cta-button" id="nextTaskBtn" disabled>${quantityRoundIndex < totalQuantityRounds ? 'Next Round' : 'Finish Simulation'}</button>
    </div>
  `;

  const groupsEl = document.getElementById('dotGroups');
  const feedback = document.getElementById('taskFeedback');
  const nextBtn = document.getElementById('nextTaskBtn');
  if (!groupsEl) return;

  const groups = options.map((option) => {
    const group = createDotGroup(option.baseCount);
    group.dataset.adjusted = String(option.adjusted);

    const modifier = document.createElement('div');
    modifier.className = 'dot-group-modifier';
    const symbol = option.sign > 0 ? '+' : '−';
    modifier.innerHTML = `<span class="modifier-sign">${symbol}</span><span class="modifier-roman">${toRoman(option.magnitude)}</span>`;
    group.appendChild(modifier);

    return group;
  });

  groups.forEach((group) => groupsEl.appendChild(group));

  groups.forEach((group) => {
    group.addEventListener('click', () => {
      groups.forEach((g) => g.classList.remove('selected'));
      group.classList.add('selected');
      const selectedTotal = Number(group.dataset.adjusted);
      const isCorrect = selectedTotal === greatest;
      if (feedback) {
        feedback.textContent = isCorrect
          ? 'Correct. You selected the greatest resulting quantity.'
          : 'Not quite. Re-check each option after applying its Roman numeral modifier.';
      }
      if (nextBtn) nextBtn.disabled = !isCorrect;
    });
  });

  if (nextBtn) nextBtn.addEventListener('click', advanceQuantityRound);
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

    if (operatorEl && Math.random() < chance) {
      const original = operatorEl.dataset.original || '+';
      const alternatives = ['+', '-', '×'].filter((symbol) => symbol !== original);
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
      group.style.transform = `translate(${randBetween(-amp * 1.6, amp * 1.6)}px, ${randBetween(-amp * 0.9, amp * 0.9)}px)`;
      group.style.gap = `${randBetween(5, 8 + amp)}px`;
      group.style.opacity = `${randBetween(0.9, 1)}`;

      const dots = group.querySelectorAll('.dot');
      dots.forEach((dot) => {
        dot.style.transform = `translate(${randBetween(-amp * 0.45, amp * 0.45)}px, ${randBetween(-amp * 0.45, amp * 0.45)}px)`;
      });
    });
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
  intensityLabelEl = controlBarEl ? controlBarEl.querySelector('.dyscalc-intensity-label') : null;

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
  reflectionEl = document.getElementById('reflectionCard');
  controlBarEl = document.getElementById('dyscalcControlBar');
  simBackBtnEl = document.getElementById('simBackBtn');
  simTitleEl = document.getElementById('simTitle');
  simCardEl = document.querySelector('.dyscalc-sim-card');

  if (reflectionEl) { reflectionEl.hidden = true; }

  if (!simTaskAreaEl) return;

  setupControls();
  renderTask();
  restartAnimationLoop();
  updatePauseUI();
});
