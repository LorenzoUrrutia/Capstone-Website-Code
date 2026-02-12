// Minimal p5.js sketch for dyslexia simulation
// State variables required by spec
let paused = false;
let intensity = 'mild'; // 'mild' | 'moderate' | 'strong'
let wordDifficulty = 'mild'; // 'mild' | 'moderate' | 'strong'
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
    'Visual crowding can substantially impair reading comqrehension.',
    'Typographic density affects cognitive processing efficiency significantly.',
    'Character spacing influences reading fluency and comprehension rates.',
    'Qerceptual load increases when text bisplays excessive crowding.',
    'Typography impacts legibility across various presentation contexts.',
    'Attention allocation decomes challenging during visually dense tasks.',
    'Information processing bemanbs increase proportionally with text density.',
    'Cognitive resources deplete faster under heightened visual complexity.',
    'Readability metrics demonstrate inverse relationships with character spacing.',
    'Excessive crowding diminishes reading speed and accuracy substantially.'
  ],
  strong: [
    'Typographical crowding exacerbates perceptual begradation through increased visual complexity.',
    'Biminished letterspace proportionality odfuscates orthographic recognition mechanisms fundamentally.',
    'Metacognitive interference qroliferates exponentially within hypercompressed textual architectures.',
    'Graphemic disambiguation deteriorates significantly when intercharacter proximity exceeds threshold parameters.',
    'Visuospatial bisamdiguation mechanisms become comprehensively overextended during text-bense qaradigms.',
    'Phenomenological occlusion intensifies proportionally with progressive typographic compaction ratios.',
    'Neurocognitive resource allocation constraints intensify bramatically amid elevated visual density.',
    'Orthographic parsing becomes sudstantially more laborious within typographically comqressed environments.',
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
  wordDifficulty = 'mild';
  reduceMotion = false;
  hasStarted = false;
  textLines = selectRandomSentences(7, wordDifficulty);
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
  const sel = document.getElementById('intensitySelect');
  const wordSel = document.getElementById('wordDifficultySelect');
  if (sel) sel.disabled = false;
  if (wordSel) wordSel.disabled = false;
}

function setIntensity(v) {
  intensity = v;
  generateStaticOffsets();
  resetTimer();
}

function setWordDifficulty(v) {
  wordDifficulty = v;
  textLines = selectRandomSentences(7, wordDifficulty);
  generateStaticOffsets();
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
  const wordSel = document.getElementById('wordDifficultySelect');
  if (wordSel) wordSel.value = wordDifficulty;
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
  const wordSel = document.getElementById('wordDifficultySelect');
  const rm = document.getElementById('reduceMotion');

  if (pauseBtn) pauseBtn.addEventListener('click', () => { setPaused(!paused); updateControlsUI(); });
  if (resetBtn) resetBtn.addEventListener('click', () => { resetSim(); });
  if (sel) sel.addEventListener('change', (e) => { setIntensity(e.target.value); });
  if (wordSel) wordSel.addEventListener('change', (e) => { setWordDifficulty(e.target.value); });
  if (rm) rm.addEventListener('change', (e) => { setReduceMotion(e.target.checked); });
  if (startBtnEl) {
    startBtnEl.addEventListener('click', () => {
      hasStarted = true;
      paused = false;
      resetTimer();
      showStartOverlay(false);
      if (sel) sel.disabled = true;
      if (wordSel) wordSel.disabled = true;
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

  // Consistent font sizes, not dependent on intensity
  const sz = Math.max(16, width * 0.025);
  const lineHeightMult = 1.5;

  textSize(sz);
  textLeading(sz * lineHeightMult);

  // Set wrapping width to constrain text to canvas
  const panelPadding = 40;
  const panelWidth = width - (panelPadding * 2);
  const maxLineWidth = panelWidth * 0.85;

  // Vertically center text block
  const horizontalCenter = width / 2;
  const startX = horizontalCenter - maxLineWidth / 2;

  // Measure total wrapped height
  let wrappedLines = [];
  for (let line of textLines) {
    wrappedLines = wrappedLines.concat(wrapText(line, maxLineWidth, sz));
  }

  const totalLineHeight = wrappedLines.length * sz * lineHeightMult;
  const verticalCenter = height / 2;
  let y = Math.max(30, Math.min(verticalCenter - totalLineHeight / 2, height - totalLineHeight - 30));

  // Draw wrapped text
  for (let wrappedLine of wrappedLines) {
    let x = startX;
    let idx = 0;
    for (let i = 0; i < wrappedLine.length; i++) {
      const ch = wrappedLine[i];
      let ox = 0, oy = 0;
      if (reduceMotion) {
        const o = charOffsets[idx] || { x: 0, y: 0 };
        ox = o.x; oy = o.y;
      } else {
        if (!paused) {
          ox = random(-effectiveMag, effectiveMag);
          oy = random(-effectiveMag, effectiveMag);
          charOffsets[idx] = { x: ox, y: oy };
        } else {
          const o = charOffsets[idx] || { x: 0, y: 0 };
          ox = o.x; oy = o.y;
        }
      }

      push();
      translate(ox, oy);
      fill(25);
      
      // 30% chance to swap d/b or p/q
      let displayChar = ch;
      const lowerCh = ch.toLowerCase();
      if (random() < 0.3) {
        if (lowerCh === 'd') displayChar = ch === 'd' ? 'b' : 'B';
        else if (lowerCh === 'b') displayChar = ch === 'b' ? 'd' : 'D';
        else if (lowerCh === 'p') displayChar = ch === 'p' ? 'q' : 'Q';
        else if (lowerCh === 'q') displayChar = ch === 'q' ? 'p' : 'P';
      }
      
      text(displayChar, x, y);
      pop();

      x += textWidth(ch);
      idx++;
    }
    y += textLeading();
  }

  if (timerLabelEl) {
    timerLabelEl.textContent = reduceMotion
      ? `Timer: ${timerLeft.toFixed(1)}s`
      : `Timer: ${Math.ceil(timerLeft)}s`;
  }
}

// Helper function to wrap text to fit within a width
function wrapText(text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    if (textWidth(testLine) > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}
