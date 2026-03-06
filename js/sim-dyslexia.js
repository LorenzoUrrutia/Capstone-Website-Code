// Dyslexia simulation with sentence-based reading
// State variables required by spec
let paused = false;
let intensity = 'mild'; // 'mild' | 'moderate' | 'strong'
let wordDifficulty = 'Harry_Potter';
let hasStarted = false;

let containerEl;
let paperContentEl;
let startOverlayEl;
let startBtnEl;
let textLines = [];
let charElements = []; // array of character span elements
let animationFrameId = null;

// Sentence pools organized by difficulty level
const sentencePool = {
  Harry_Potter: [
    'Harry woke early the next morning. Although he could tell it was daylight, he kept his eyes shut tight.',
  '“It was a dream,” he told himself firmly. “I dreamed a giant called Hagrid came to tell me I was going to a school for wizards. When I open my eyes I’ll be at home in my cupboard.”',
  'There was suddenly a loud tapping noise.',
  'And there’s Aunt Petunia knocking on the door, Harry thought, his heart sinking. But he still didn’t open his eyes. It had been such a good dream.',
  'Tap. Tap. Tap.',
  '“All right,” Harry mumbled, “I’m getting up.”',
  'He sat up and Hagrid’s heavy coat fell off him. The hut was full of sunlight, the storm was over, Hagrid himself was asleep on the collapsed sofa, and there was an owl rapping its claw on the window, a newspaper held in its beak.',
  'Harry scrambled to his feet, so happy he felt as though a large balloon was swelling inside him. He went straight to the window and jerked it open. The owl swooped in and dropped the newspaper on top of Hagrid, who didn’t wake up. The owl then fluttered onto the floor and began to attack Hagrid’s coat.'
  ],
  House_on_Mango_Street: [
    'We did not always live on Mango Street. Before that we lived on Loomis on the third floor, and before that we lived on Keeler. Before Keeler it was Paulina, and before that I can not remember. But what I remember most is moving a lot. Each time it seemed there would be one more of us. By the time we got to Mango Street we were six—Mama, Papa, Carlos, Kiki, my sister Nenny and me.',
    'The house on Mango Street is ours, and we don not have to pay rent to anybody, or share the yard with the people downstairs, or be careful not to make too much noise, and there is not a landlord banging on the ceiling with a broom. But even so, it is not the house we had thought we would get.',
    'We had to leave the flat on Loomis quick. The water pipes broke and the landlord would not fix them because the house was too old. We had to leave fast. We were using the washroom next door and carrying water over in empty milk gallons. That is why Mama and Papa looked for a house, and that is why we moved into the house on Mango Street, far away, on the other side of town.',
    'They always told us that one day we would move into a house, a real house that would be ours for always so we would not have to move each year. And our house would have running water and pipes that worked. And inside it would have real stairs, not hallway stairs, but stairs inside like the houses on TV. And we would have a basement and at least three washrooms so when we took a bath we would not have to tell everybody. Our house would be white with trees around it, a great big yard and grass growing without a fence. This was the house Papa talked about when he held a lottery ticket and this was the house Mama dreamed up in the stories she told us before we went to bed.'
  ],
  Beloved: [
    'For years Paul D believed schoolteacher broke into children what Garner had raised into men.',
    'And it was that that made them run off.', 
    'Now, plagued by the contents of his tobacco tin, he wondered how much difference there really was between before schoolteacher and after.', 
    'Garner called and announced them men--but only on Sweet Home, and by his leave.', 
    'Was he naming what he saw or,creating what he did not?', 
    'That was the wonder of Sixo, and even Halle; it was always clear to Paul D that those two were men whether Garner said so or not.',
    'It troubled him that, concerning his own manhood, he could not satisfy himself on that point.',
    'Oh, he did manly things, but was that Garners gift or his own will?',
    'What would he have been anyway--before Sweet Home--without Garner? In Sixos country, or his mothers? Or, God help him, on the boat? Did a whiteman saying it make it so? Suppose Garner woke up one morning and changed his mind? Took the word away. Would they have run then? And if he did not, would the Pauls have stayed there all their lives? Why did the brothers need the one whole night to decide? To discuss whether they would join Sixo and Halle. Because they had been isolated in a wonderful lie, dismissing Halles and Baby Suggs life before Sweet Home as bad luck. Ignorant of oramused by Sixos dark stories. Protected and convinced they were special.',
    'Never suspecting the problem of Alfred, Georgia; being so in love with the look of the world, putting up with anything and everything, just to stay alive in a place where a moon he had no right to was nevertheless there.' ,
    'Loving small and in secret. His little love was a tree, of course, but not like Brother--old, wide and beckoning.'
  ]
};

function selectSentencesInOrder(level = 'Harry_Potter') {
  const pool = sentencePool[level] || sentencePool.Harry_Potter;
  return [...pool];
}

function initState() {
  paused = false;
  intensity = 'mild';
  wordDifficulty = 'Harry_Potter';
  hasStarted = false;
  
  textLines = selectSentencesInOrder(wordDifficulty);
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
    const tokens = sentence.match(/\S+|\s+/g) || [];

    tokens.forEach((token) => {
      if (/^\s+$/.test(token)) {
        const space = document.createElement('span');
        space.className = 'space';
        space.textContent = token;
        p.appendChild(space);
        return;
      }

      const word = document.createElement('span');
      word.className = 'word';

      for (let i = 0; i < token.length; i++) {
        const char = token[i];
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char;
        charElements.push(span);
        word.appendChild(span);
      }

      p.appendChild(word);
    });

    if (index < textLines.length - 1) {
      const spacer = document.createElement('span');
      spacer.className = 'space';
      spacer.textContent = ' ';
      p.appendChild(spacer);
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
  const effectiveMag = mag;
  
  charElements.forEach((span) => {
    const ox = (Math.random() - 0.5) * effectiveMag * 2;
    const oy = (Math.random() - 0.5) * effectiveMag * 2;
    span.style.transform = `translate(${ox}px, ${oy}px)`;
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
  textLines = selectSentencesInOrder(wordDifficulty);
  renderPassage();
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
}

function showStartOverlay(visible) {
  if (!startOverlayEl) return;
  startOverlayEl.style.display = visible ? 'flex' : 'none';
  if (containerEl) {
    containerEl.classList.toggle('hidden-before-start', visible);
  }
}

function setup() {
  containerEl = document.getElementById('canvas-container');
  startOverlayEl = document.getElementById('startOverlay');
  startBtnEl = document.getElementById('startBtn');
  paperContentEl = document.getElementById('paper-content');
  initState();

  // Wire simple controls if present
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const sel = document.getElementById('intensitySelect');
  const wordSel = document.getElementById('wordDifficultySelect');
  const doneBtn = document.getElementById('doneReadingBtn');

  if (pauseBtn) pauseBtn.addEventListener('click', () => { setPaused(!paused); updateControlsUI(); });
  if (resetBtn) resetBtn.addEventListener('click', () => { resetSim(); });
  if (sel) sel.addEventListener('change', (e) => { setIntensity(e.target.value); });
  if (wordSel) wordSel.addEventListener('change', (e) => { setWordDifficulty(e.target.value); });
  if (doneBtn) doneBtn.addEventListener('click', () => {
    stopAnimation();
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
