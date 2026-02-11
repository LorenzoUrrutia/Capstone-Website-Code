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
let textLines = [];
let charOffsets = []; // last offsets (used for pause / reduceMotion)

// Sentence pool organized by difficulty level
const sentencePool = {
  mild: [
    'A quiet room can still feel busy on the page.',
    'Short words sometimes look longer than they are.',
    'Lines can blur together even when you try to focus.',
    'A simple sentence can take extra time to settle.',
    'Reading feels different when you are pressed for time.',
    'Text can seem to shift even when it stays still.',
    'Words blend when they are packed too closely.',
    'Clear spacing usually helps reading flow smoothly.',
    'Careful focus is needed for every word now.',
    'Reading takes more effort under time pressure.'
  ],
  moderate: [
    'Visual crowding can substantially impair reading comprehension.',
    'Typographic density affects cognitive processing efficiency significantly.',
    'Character spacing influences reading fluency and comprehension rates.',
    'Perceptual load increases when text displays excessive crowding.',
    'Typography impacts legibility across various presentation contexts.',
    'Attention allocation becomes challenging during visually dense tasks.',
    'Information processing demands increase proportionally with text density.',
    'Cognitive resources deplete faster under heightened visual complexity.',
    'Readability metrics demonstrate inverse relationships with character spacing.',
    'Excessive crowding diminishes reading speed and accuracy substantially.'
  ],
  strong: [
    'Typographical crowding exacerbates perceptual degradation through increased visual complexity.',
    'Diminished letterspace proportionality obfuscates orthographic recognition mechanisms fundamentally.',
    'Metacognitive interference proliferates exponentially within hypercompressed textual architectures.',
    'Graphemic disambiguation deteriorates significantly when intercharacter proximity exceeds threshold parameters.',
    'Visuospatial disambiguation mechanisms become comprehensively overextended during text-dense paradigms.',
    'Phenomenological occlusion intensifies proportionally with progressive typographic compaction ratios.',
    'Neurocognitive resource allocation constraints intensify dramatically amid elevated visual density.',
    'Orthographic parsing becomes substantially more laborious within typographically compressed environments.',
    'Attentional bandwidth depletion accelerates precipitously during extended crowded-text engagement.',
    'Cognitive ergonomics deteriorate substantially when environmental typographic parameters exceed optimization thresholds.'
  ]
};

function selectRandomSentences(count, level = 'mild') {
  const pool = sentencePool[level] || sentencePool.mild;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

// Timer state
let timerMax = 15; // seconds
let timerLeft = 15; // seconds remaining
let lastTickMs = 0;

function getTimerMaxForIntensity(level) {
  return 15;
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
  textLines = selectRandomSentences(7, intensity);
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
  if (level === 'moderate') return 2.2;
  if (level === 'strong') return 4.5;
  return 0.8; // mild
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
  textLines = selectRandomSentences(7, intensity);
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
  textFont("system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif");
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

  // Set font size and line height based on intensity
  let sz;
  let lineHeightMult;
  if (intensity === 'strong') {
    sz = Math.max(11, width * 0.016);
    lineHeightMult = 1.2;
  } else if (intensity === 'moderate') {
    sz = Math.max(14, width * 0.024);
    lineHeightMult = 1.4;
  } else {
    sz = Math.max(15, width * 0.026);
    lineHeightMult = 1.55;
  }

  textSize(sz);
  textLeading(sz * lineHeightMult);

  // Measure text width for centering on reading block
  const maxLineWidth = textLines.reduce((max, line) => Math.max(max, textWidth(line)), 0);
  const panelPadding = 50;
  const panelWidth = width - (panelPadding * 2);
  const maxContentWidth = panelWidth * 0.9;
  const contentWidth = Math.min(maxLineWidth, maxContentWidth);
  const horizontalCenter = width / 2;
  const startX = horizontalCenter - contentWidth / 2;

  // Vertically center text block with generous bounds checking
  const totalLineHeight = textLines.length * sz * lineHeightMult;
  const verticalCenter = height / 2;
  let y = Math.max(30, Math.min(verticalCenter - totalLineHeight / 2, height - totalLineHeight - 30));

  // Draw each character with per-character offset
  const padding = 20;
  let x = startX;

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
      fill(25);
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
