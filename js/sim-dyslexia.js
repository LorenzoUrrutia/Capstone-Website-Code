// HTML-based dyslexia simulation with scrollable passage
// State variables required by spec
let paused = false;
let intensity = 'mild'; // 'mild' | 'moderate' | 'strong'
let wordDifficulty = 'mild'; // 'mild' | 'moderate' | 'strong'
let reduceMotion = false;
let hasStarted = false;

let containerEl;
let paperContentEl;
let startOverlayEl;
let startBtnEl;
let quizOverlayEl;
let textLines = [];
let charElements = []; // array of character span elements
let animationFrameId = null;

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



function initState() {
  paused = false;
  intensity = 'mild';
  wordDifficulty = 'mild';
  reduceMotion = false;
  hasStarted = false;
  textLines = selectRandomSentences(7, wordDifficulty);
  renderPassage();
  updateControlsUI();
}

function renderPassage() {
  if (!paperContentEl) return;
  
  // Clear existing content
  paperContentEl.innerHTML = '';
  charElements = [];
  
  // Render each line as a paragraph
  textLines.forEach(line => {
    const p = document.createElement('p');
    
    if (line === '') {
      p.innerHTML = '&nbsp;';
      paperContentEl.appendChild(p);
      return;
    }
    
    // Wrap each character in a span for jitter effect
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char;
      
      if (char === ' ') {
        span.style.width = '0.3em';
      }
      
      charElements.push(span);
      p.appendChild(span);
    }
    
    paperContentEl.appendChild(p);
  });
  
  // Start animation if simulation has started
  if (hasStarted && !paused) {
    startAnimation();
  }
}

function intensityToMag(level) {
  if (level === 'moderate') return 2.2;
  if (level === 'strong') return 4.5;
  return 0.8; // mild
}

function applyJitterEffect() {
  if (!hasStarted || paused) return;
  
  const mag = intensityToMag(intensity);
  const effectiveMag = reduceMotion ? mag * 0.5 : mag;
  
  charElements.forEach((span) => {
    if (reduceMotion) {
      // Static offset for reduce motion
      if (!span.dataset.offsetX) {
        span.dataset.offsetX = (Math.random() - 0.5) * effectiveMag;
        span.dataset.offsetY = (Math.random() - 0.5) * effectiveMag;
      }
      span.style.transform = `translate(${span.dataset.offsetX}px, ${span.dataset.offsetY}px)`;
    } else {
      // Dynamic jitter
      const ox = (Math.random() - 0.5) * effectiveMag * 2;
      const oy = (Math.random() - 0.5) * effectiveMag * 2;
      span.style.transform = `translate(${ox}px, ${oy}px)`;
    }
  });
}

function startAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  function animate() {
    applyJitterEffect();
    if (hasStarted && !paused) {
      animationFrameId = requestAnimationFrame(animate);
    }
  }
  
  animate();
}

function stopAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  // Reset transforms
  charElements.forEach(span => {
    span.style.transform = '';
  });
}

function setPaused(v) {
  if (!hasStarted) return;
  paused = !!v;
  
  if (paused) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

function resetSim() {
  hasStarted = false;
  stopAnimation();
  initState();
  showQuizOverlay(false);
  showStartOverlay(true);
  const sel = document.getElementById('intensitySelect');
  const wordSel = document.getElementById('wordDifficultySelect');
  if (sel) sel.disabled = false;
  if (wordSel) wordSel.disabled = false;
}

function setIntensity(v) {
  intensity = v;
  if (hasStarted) {
    // Regenerate static offsets for reduce motion
    charElements.forEach(span => {
      delete span.dataset.offsetX;
      delete span.dataset.offsetY;
    });
  }
}

function setWordDifficulty(v) {
  wordDifficulty = v;
  textLines = selectRandomSentences(7, wordDifficulty);
  renderPassage();
}

function setReduceMotion(v) {
  reduceMotion = !!v;
  if (reduceMotion) {
    // Clear existing offsets to regenerate
    charElements.forEach(span => {
      delete span.dataset.offsetX;
      delete span.dataset.offsetY;
    });
  }
}

function updateControlsUI() {
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) {
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    pauseBtn.disabled = !hasStarted;
  }
  const doneBtn = document.getElementById('doneReadingBtn');
  if (doneBtn) {
    doneBtn.disabled = !hasStarted;
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

function showQuizOverlay(visible) {
  if (!quizOverlayEl) return;
  quizOverlayEl.style.display = visible ? 'flex' : 'none';
  if (visible) {
    paused = true;
    stopAnimation();
    updateControlsUI();
  }
}

function setup() {
  containerEl = document.getElementById('canvas-container');
  paperContentEl = document.getElementById('paper-content');
  startOverlayEl = document.getElementById('startOverlay');
  startBtnEl = document.getElementById('startBtn');
  quizOverlayEl = document.getElementById('quizOverlay');
  
  initState();

  // Wire simple controls if present
  const pauseBtn = document.getElementById('pauseBtn');
  const doneReadingBtn = document.getElementById('doneReadingBtn');
  const resetBtn = document.getElementById('resetBtn');
  const sel = document.getElementById('intensitySelect');
  const wordSel = document.getElementById('wordDifficultySelect');
  const rm = document.getElementById('reduceMotion');
  const submitQuizBtn = document.getElementById('submitQuizBtn');

  if (pauseBtn) pauseBtn.addEventListener('click', () => { setPaused(!paused); updateControlsUI(); });
  if (doneReadingBtn) doneReadingBtn.addEventListener('click', () => { showQuizOverlay(true); });
  if (resetBtn) resetBtn.addEventListener('click', () => { resetSim(); });
  if (sel) sel.addEventListener('change', (e) => { setIntensity(e.target.value); });
  if (wordSel) wordSel.addEventListener('change', (e) => { setWordDifficulty(e.target.value); });
  if (rm) rm.addEventListener('change', (e) => { setReduceMotion(e.target.checked); });
  if (submitQuizBtn) submitQuizBtn.addEventListener('click', () => { 
    // Quiz submission logic will go here
    alert('Quiz submitted! (Questions will be added later)');
    showQuizOverlay(false);
  });
  if (startBtnEl) {
    startBtnEl.addEventListener('click', () => {
      hasStarted = true;
      paused = false;
      showStartOverlay(false);
      startAnimation();
      if (sel) sel.disabled = true;
      if (wordSel) wordSel.disabled = true;
      updateControlsUI();
    });
  }

  showStartOverlay(true);
}

// No longer need p5.js draw loop or window resize handler
// Animation is handled by requestAnimationFrame
