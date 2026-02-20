// Dyslexia simulation with sentence-based reading
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

// Sentence pools organized by difficulty level
const sentencePool = {
  easy: [
    'A quiet room can still feel busy on the page.',
    'Short words sometimes look longer than they are.',
    'Lines can blur together even when you try to focus.',
    'A simple sentence can take extra time to settle.',
    'Reading feels different when you are pressed for time.',
    'Text can seem to shift even when it stays still.',
    'Words blend when they are packed too closely.',
    'Clear spacing usually helps reading flow smoothly.',
    'Careful focus is needed for every word now.',
    'Reading takes more effort under time pressure.',
    'The bell rang at the end of the hallway, and students slowly returned to their seats.',
    'Some whispered to their friends as they opened their books, while others waited quietly for the teacher to begin.',
    'Every morning, the cafeteria filled with the sound of trays sliding across the counter and voices echoing across the room.',
    'Students lined up to choose their breakfast before heading to class, often stopping to talk with friends along the way.',
    'After school, the sky was still bright, and the air felt warm against the pavement.',
    'A small group of students walked together toward the bus stop, sharing stories about their day as they went.',
    'The classroom windows let in soft light from outside as students opened their notebooks and began writing.',
    'The room felt calm, and the steady sound of pencils on paper made it easier for many students to focus on what they were doing.',
    'On the weekend, the neighborhood was quieter than usual, and fewer cars passed through the streets.',
    'People spent more time outdoors, sometimes stopping to greet one another as they walked by.'
  ],
  medium: [
    'Visual crowding can substantially impair reading comprehension and retention when letter spacing becomes too compressed.',
    'Typographic density affects cognitive processing efficiency significantly, especially during timed reading assessments.',
    'Character spacing influences reading fluency and comprehension rates in ways that become more apparent under time pressure.',
    'Perceptual load increases when text displays excessive crowding, making it harder to distinguish individual letters and words.',
    'Typography impacts legibility across various presentation contexts, from digital screens to printed materials.',
    'Attention allocation becomes challenging during visually dense tasks that require sustained focus and careful processing.',
    'Information processing demands increase proportionally with text density, often overwhelming working memory capacity.',
    'Cognitive resources deplete faster under heightened visual complexity, particularly when combined with simultaneous demands.',
    'Readability metrics demonstrate inverse relationships with character spacing, suggesting optimal ranges for different contexts.',
    'Excessive crowding diminishes reading speed and accuracy substantially, creating barriers for readers with visual processing differences.',
    'In recent years, many secondary schools have revised their instructional models to emphasize collaborative, project-based learning approaches.',
    'Proponents argue that such approaches cultivate transferable skills, including communication, adaptability, and collective problem solving across diverse contexts.',
    'Coordinating group roles, assessing individual contributions, and ensuring equitable participation require deliberate planning and structured frameworks.',
    'Educators have increasingly incorporated structured reflection into classroom routines, asking students to document and analyze their learning processes.',
    'By asking students to explain how they approached complex tasks, teachers make invisible cognitive strategies visible and transferable.',
    'Studies suggest reflection helps most when it is part of ongoing instruction, not an isolated add-on introduced during final assessments.',
    'The integration of digital tools has fundamentally reshaped how students find information, evaluate sources, and synthesize knowledge.',
    'Learners often compare multiple sources, check reliability through cross-referencing, and combine ideas to construct deeper understanding.',
    'Fast-paced online environments may encourage quick surface reading over deep analytical thinking and sustained contemplation.',
    'Teachers carefully balance the affordances of technology with deliberate time for focused, sustained reading and critical analysis.'
  ],
  hard: [
    'Typographical crowding exacerbates perceptual degradation through increased visual complexity, systematically undermining orthographic recognition processes.',
    'Diminished letterspace proportionality fundamentally obfuscates orthographic recognition mechanisms, creating cascading failures in lexical access.',
    'Metacognitive interference proliferates exponentially within hypercompressed textual architectures, overwhelming executive function allocation systems.',
    'Graphemic disambiguation deteriorates significantly when intercharacter proximity exceeds threshold parameters established by psychophysical research.',
    'Visuospatial disambiguation mechanisms become comprehensively overextended during text-dense paradigms that demand sustained attentional focus.',
    'Phenomenological occlusion intensifies proportionally with progressive typographic compaction ratios, disrupting normal reading automaticity.',
    'Neurocognitive resource allocation constraints intensify dramatically amid elevated visual density that exceeds optimal processing capacity.',
    'Orthographic parsing becomes substantially more laborious within typographically compressed environments that violate perceptual spacing conventions.',
    'Attentional bandwidth depletion accelerates precipitously during extended crowded-text engagement, particularly under time-constrained conditions.',
    'Cognitive ergonomics deteriorate substantially when environmental typographic parameters exceed optimization thresholds established through empirical investigation.',
    'Contemporary discourse on educational equity frequently centers on the expansion of access to advanced coursework and rigorous academic opportunities, yet rarely interrogates underlying assumptions.',
    'While such initiatives are typically motivated by a genuine commitment to fairness and opportunity, they simultaneously raise complex epistemological questions regarding how academic rigor is conceptualized, measured, and validated.',
    'When curricular frameworks prioritize accelerated pacing, uniform standardized benchmarks, and narrowly defined modes of assessment, students may encounter systemic misalignment between their learning profiles and institutional expectations.',
    'This misalignment can generate the appearance of underperformance, not as a reflection of limited intellectual capacity or engagement, but rather as an artifact of evaluative regimes that privilege particular forms of demonstration over others.',
    'In such contexts, learners who require alternative pacing strategies or different forms of instructional scaffolding may be systematically interpreted as lacking fundamental ability, when in fact the issue resides in structural inflexibility.',
    'Consequently, initiatives ostensibly intended to promote equity may inadvertently reproduce and amplify existing inequities when they fail to critically interrogate the assumptions embedded within prevailing institutional definitions of achievement and merit.',
    'The increasing reliance on quantifiable metrics to assess educational outcomes reflects a broader institutional commitment to measurability, operational efficiency, and public accountability in an era of heightened scrutiny.',
    'Proponents of data-driven approaches contend that numerical indicators facilitate meaningful comparability across contexts, enable large-scale longitudinal analysis, and provide ostensibly objective benchmarks for evaluating institutional performance.',
    'Learning is not a unidimensional process confined to the accumulation of discrete factual knowledge or the demonstration of isolated procedural competence on standardized assessments.',
    'Rather, it encompasses the development of interpretive judgment, the integration of complex conceptual frameworks, and the capacity to transfer understanding flexibly across diverse contexts and novel problem spaces.'
  ]
};

function selectRandomSentences(count, level = 'easy') {
  const pool = sentencePool[level] || sentencePool.easy;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

function initState() {
  paused = false;
  intensity = 'mild';
  wordDifficulty = 'mild';
  reduceMotion = false;
  hasStarted = false;
  
  // Map wordDifficulty to sentence pool keys
  const difficultyMap = {
    'mild': 'easy',
    'moderate': 'medium',
    'strong': 'hard'
  };
  const poolKey = difficultyMap[wordDifficulty] || 'easy';
  textLines = selectRandomSentences(7, poolKey);
  renderPassage();
  updateControlsUI();
}

function renderPassage() {
  if (!paperContentEl) return;
  
  // Clear existing content
  paperContentEl.innerHTML = '';
  charElements = [];
  
  // Render all sentences as one paragraph
  const p = document.createElement('p');
  p.style.marginBottom = '0';
  
  textLines.forEach((sentence, index) => {
    // Wrap each character in a span for jitter effect
    for (let i = 0; i < sentence.length; i++) {
      const char = sentence[i];
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char;
      
      if (char === ' ') {
        span.style.width = '0.3em';
      }
      
      charElements.push(span);
      p.appendChild(span);
    }
    
    // Add space between sentences (but not after the last one)
    if (index < textLines.length - 1) {
      const space = document.createElement('span');
      space.className = 'char';
      space.textContent = ' ';
      space.style.width = '0.3em';
      charElements.push(space);
      p.appendChild(space);
    }
  });
  
  paperContentEl.appendChild(p);
  
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

function setIntensity(v) {
  intensity = v;
  updateControlsUI();
  // Intensity only affects visual jitter magnitude, not word selection
}

function setWordDifficulty(v) {
  wordDifficulty = v;
  let poolKey;
  if (wordDifficulty === 'moderate') {
    poolKey = 'medium';
  } else if (wordDifficulty === 'strong') {
    poolKey = 'hard';
  } else {
    poolKey = 'easy';
  }
  textLines = selectRandomSentences(7, poolKey);
  renderPassage();
}

function generateStaticOffsets() {
  // Generate static random offsets for reduce motion mode
  // This is called once when reduce motion is enabled
}

function setPaused(value) {
  paused = value;
  if (paused) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

function resetSim() {
  stopAnimation();
  hasStarted = false;
  paused = false;
  showStartOverlay(true);
  const sel = document.getElementById('intensitySelect');
  const wordSel = document.getElementById('wordDifficultySelect');
  if (sel) sel.disabled = false;
  if (wordSel) wordSel.disabled = false;
  updateControlsUI();
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
  startOverlayEl = document.getElementById('startOverlay');
  startBtnEl = document.getElementById('startBtn');
  paperContentEl = document.getElementById('paper-content');
  initState();

  // Wire simple controls if present
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const sel = document.getElementById('intensitySelect');
  const wordSel = document.getElementById('wordDifficultySelect');
  const rm = document.getElementById('reduceMotion');
  const doneBtn = document.getElementById('doneReadingBtn');

  if (pauseBtn) pauseBtn.addEventListener('click', () => { setPaused(!paused); updateControlsUI(); });
  if (resetBtn) resetBtn.addEventListener('click', () => { resetSim(); });
  if (sel) sel.addEventListener('change', (e) => { setIntensity(e.target.value); });
  if (wordSel) wordSel.addEventListener('change', (e) => { setWordDifficulty(e.target.value); });
  if (rm) rm.addEventListener('change', (e) => { setReduceMotion(e.target.checked); });
  if (doneBtn) doneBtn.addEventListener('click', () => { 
    stopAnimation();
    document.getElementById('quizOverlay').style.display = 'flex'; 
  });

  if (startBtnEl) {
    startBtnEl.addEventListener('click', () => {
      hasStarted = true;
      paused = false;
      showStartOverlay(false);
      if (sel) sel.disabled = true;
      if (wordSel) wordSel.disabled = true;
      updateControlsUI();
      startAnimation();
    });
  }

  showStartOverlay(true);
}
