// Minimal p5.js sketch for dyslexia simulation
// State variables required by spec
let paused = false;
let intensity = 'mild'; // 'mild' | 'moderate' | 'strong'
let reduceMotion = false;
let hasStarted = false;

let canvas, containerEl;
let timerLabelEl;
let startOverlayEl;
let startBtnEl;
let textLines = [
  'A quiet room can still feel busy on the page.',
  'Short words sometimes look longer than they are.',
  'Lines can blur together even when you try to focus.',
  'A simple sentence can take extra time to settle.'
];
let charOffsets = []; // last offsets (used for pause / reduceMotion)

// Timer state
let timerMax = 15; // seconds
let timerLeft = 15; // seconds remaining
let lastTickMs = 0;

function getTimerMaxForIntensity(level) {
  if (level === 'moderate') return 10;
  if (level === 'strong') return 7;
  return 15; // mild
}

function resetTimer() {
  timerMax = getTimerMaxForIntensity(intensity);
  timerLeft = timerMax;
  lastTickMs = 0;
}

function initState() {
  paused = false;
  intensity = 'mild';
  reduceMotion = false;
  hasStarted = false;
  generateStaticOffsets();
  resetTimer();
  updateControlsUI();
}

function generateStaticOffsets() {
  const mag = intensityToMag(intensity);
  const effectiveMag = reduceMotion ? mag * 0.5 : mag;
  charOffsets = [];
  const totalChars = textLines.join('\n').length;
  for (let i = 0; i < totalChars; i++) {
    charOffsets.push({ x: random(-effectiveMag, effectiveMag), y: random(-effectiveMag, effectiveMag) });
  }
}

function intensityToMag(level) {
  if (level === 'moderate') return 3.5;
  if (level === 'strong') return 7.0;
  return 1.5; // mild
}

function setPaused(v) {
  if (!hasStarted) return;
  const wasPaused = paused;
  paused = !!v;
  // Reset timer tracking when unpausing to avoid jump
  if (wasPaused && !paused) {
    lastTickMs = 0;
  }
}

function resetSim() {
  initState();
  resetTimer();
  showStartOverlay(true);
}

function setIntensity(v) {
  intensity = v;
  generateStaticOffsets();
  resetTimer();
}

function setReduceMotion(v) {
  reduceMotion = !!v;
  if (reduceMotion) generateStaticOffsets();
}

function updateControlsUI() {
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) {
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    pauseBtn.disabled = !hasStarted;
  }
  const sel = document.getElementById('intensitySelect');
  if (sel) sel.value = intensity;
  const rm = document.getElementById('reduceMotion');
  if (rm) rm.checked = reduceMotion;
}

function showStartOverlay(visible) {
  if (!startOverlayEl) return;
  startOverlayEl.style.display = visible ? 'flex' : 'none';
  if (containerEl) {
    containerEl.classList.toggle('hidden-before-start', visible);
  }
}

function setup() {
  containerEl = document.getElementById('canvas-container') || document.body;
  containerEl.textContent = '';
  timerLabelEl = document.getElementById('timerLabel');
  startOverlayEl = document.getElementById('startOverlay');
  startBtnEl = document.getElementById('startBtn');
  const w = containerEl.clientWidth || windowWidth;
  const h = containerEl.clientHeight || windowHeight;
  canvas = createCanvas(w, h);
  canvas.parent(containerEl);
  textFont('Arial');
  textAlign(LEFT, TOP);
  initState();

  // Wire simple controls if present
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const sel = document.getElementById('intensitySelect');
  const rm = document.getElementById('reduceMotion');

  if (pauseBtn) pauseBtn.addEventListener('click', () => { setPaused(!paused); updateControlsUI(); });
  if (resetBtn) resetBtn.addEventListener('click', () => { resetSim(); });
  if (sel) sel.addEventListener('change', (e) => { setIntensity(e.target.value); });
  if (rm) rm.addEventListener('change', (e) => { setReduceMotion(e.target.checked); });
  if (startBtnEl) {
    startBtnEl.addEventListener('click', () => {
      hasStarted = true;
      paused = false;
      resetTimer();
      showStartOverlay(false);
      updateControlsUI();
    });
  }

  showStartOverlay(true);
}

function windowResized() {
  if (!containerEl) return;
  const w = containerEl.clientWidth || windowWidth;
  const h = containerEl.clientHeight || windowHeight;
  resizeCanvas(w, h);
}

function draw() {
  // Update timer
  if (hasStarted && !paused && timerLeft > 0) {
    if (lastTickMs === 0) {
      lastTickMs = millis();
    } else {
      const now = millis();
      const delta = (now - lastTickMs) / 1000; // convert to seconds
      lastTickMs = now;
      timerLeft -= delta;
      if (timerLeft < 0) timerLeft = 0;
    }
  }

  background(247, 246, 242);
  fill(40);
  noStroke();

  const mag = intensityToMag(intensity);
  const effectiveMag = reduceMotion ? mag * 0.5 : mag;

  // Draw each character with per-character offset
  const padding = 20;
  const startX = padding;
  let x = startX;
  let y = padding;
  const sz = Math.max(14, width * 0.028);
  textSize(sz);
  textLeading(sz * 1.6);

  // Flatten lines into characters so offsets index matches
  const allText = textLines.join('\n');
  let idx = 0;
  for (let lineI = 0; lineI < textLines.length; lineI++) {
    const line = textLines[lineI];
    x = startX;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      // determine offset
      let ox = 0, oy = 0;
      if (reduceMotion) {
        const o = charOffsets[idx] || { x: 0, y: 0 };
        ox = o.x; oy = o.y;
      } else {
        if (!paused) {
          // animate jitter
          ox = random(-effectiveMag, effectiveMag);
          oy = random(-effectiveMag, effectiveMag);
          // store last offsets so pause preserves state
          charOffsets[idx] = { x: ox, y: oy };
        } else {
          const o = charOffsets[idx] || { x: 0, y: 0 };
          ox = o.x; oy = o.y;
        }
      }

      // draw character with offset
      push();
      translate(ox, oy);
      fill(30);
      text(ch, x, y);
      pop();

      x += textWidth(ch);
      idx++;
    }
    // line break (only increment idx for newline if not the last line)
    if (lineI < textLines.length - 1) {
      idx++; // account for the newline in join mapping
    }
    y += textLeading();
  }

  if (timerLabelEl) {
    timerLabelEl.textContent = reduceMotion
      ? `Timer: ${timerLeft.toFixed(1)}s`
      : `Timer: ${Math.ceil(timerLeft)}s`;
  }
}
