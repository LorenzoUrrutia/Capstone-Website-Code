// Minimal p5.js sketch for dyslexia simulation
// State variables required by spec
let paused = false;
let intensity = 'mild'; // 'mild' | 'moderate' | 'strong'
let reduceMotion = false;

let canvas, containerEl;
let textLines = [
  'Reading can feel unstable: letters may appear to shift or crowd together.'
];
let charOffsets = []; // last offsets (used for pause / reduceMotion)

function initState() {
  paused = false;
  intensity = 'mild';
  reduceMotion = false;
  generateStaticOffsets();
  updateControlsUI();
}

function generateStaticOffsets() {
  const mag = intensityToMag(intensity);
  charOffsets = [];
  const totalChars = textLines.join('\n').length;
  for (let i = 0; i < totalChars; i++) {
    charOffsets.push({ x: random(-mag, mag), y: random(-mag, mag) });
  }
}

function intensityToMag(level) {
  if (level === 'moderate') return 3.5;
  if (level === 'strong') return 7.0;
  return 1.5; // mild
}

function setPaused(v) {
  paused = !!v;
}

function resetSim() {
  initState();
}

function setIntensity(v) {
  intensity = v;
  generateStaticOffsets();
}

function setReduceMotion(v) {
  reduceMotion = !!v;
  if (reduceMotion) generateStaticOffsets();
}

function updateControlsUI() {
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  const sel = document.getElementById('intensitySelect');
  if (sel) sel.value = intensity;
  const rm = document.getElementById('reduceMotion');
  if (rm) rm.checked = reduceMotion;
}

function setup() {
  containerEl = document.getElementById('canvas-container') || document.body;
  const w = Math.max(300, containerEl.clientWidth || 600);
  const h = Math.round(w * 0.28);
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
}

function windowResized() {
  if (!containerEl) return;
  const w = Math.max(300, containerEl.clientWidth || 600);
  const h = Math.round(w * 0.28);
  resizeCanvas(w, h);
}

function draw() {
  background(250);
  fill(40);
  noStroke();

  const mag = intensityToMag(intensity);

  // Draw each character with per-character offset
  const padding = 20;
  const startX = padding;
  let x = startX;
  let y = padding;
  textSize(Math.max(14, width * 0.028));

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
          ox = random(-mag, mag);
          oy = random(-mag, mag);
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
    // line break
    y += textLeading() || textSize() * 1.4;
    idx++; // account for the newline in join mapping
  }
}
