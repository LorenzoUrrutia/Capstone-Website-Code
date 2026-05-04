// ADHD Classroom Task Simulation
// State variables
let hasStarted = false;
let currentQuestionIndex = 0;
let paused = false;
let intensity = 'mild';
let distractionEnabled = false;
let isAdvancingQuestion = false;

// DOM elements
let questionTextEl;
let answerButtonsEl;
let resetBtnEl;
let pauseBtnEl;
let intensitySelectEl;
let toastLayerEl;
let interruptOverlayEl;
let interruptTextEl;
let dismissInterruptBtnEl;
let ambientAudioEl;
let simHudEl;
let taskContainerEl;
let reflectionCardEl;

// Distraction scheduler
let toastIntervalId = null;
let nextToastTime = 0;
let nextInterruptTime = 0;
let toastIdCounter = 0;
let activeToasts = [];
const MAX_TOASTS = 3;

// Toast messages pool
const toastMessages = [
  "Group chat: Are we sitting together at lunch?",
  "Reminder: Math homework due tonight",
  "Google Classroom: New assignment posted",
  "Text from Mom: What time is practice over?",
  "Team chat: Quizlet link for vocab quiz",
  "School app: Bus route delayed 10 minutes",
  "Coach: Practice starts 30 min earlier today",
  "Friend: Can you send me yesterday's notes?",
  "Calendar: Science test tomorrow",
  "Student portal: Grade posted in English",
  "Reminder: Bring signed permission slip",
  "Group project chat: Who is doing slide 4?",
  "Notification: Yearbook order deadline Friday",
  "Text from Dad: I'm here for pickup",
  "Club chat: Meeting after school in Room 203",
  "New Snapchat from Messi"
];

// Interruption messages pool
const interruptMessages = [
  "Your phone keeps buzzing in your backpack.",
  "You remember you forgot your PE clothes.",
  "Your friend whispers and tries to get your attention.",
  "The hallway gets loud during passing period.",
  "You suddenly remember a quiz in your next class.",
  "An announcement comes over the classroom speaker.",
  "Someone nearby drops a water bottle loudly.",
  "You start thinking about lunch plans with friends.",
  "You realize your assignment might be in your locker.",
  "A classmate taps your desk to ask a question."
];

// Hardcoded questions (no randomization yet)
const questions = [
  {
    question: "Birk lives in an orange tractor on the coast of Chile. On Monday, Birk shovels sand in his tractor for 15 hours. That day, Birk has 2 eggs for breakfast, 4 tacos and 2 apples for lunch, and a salad for dinner. Birk works for the same amount of hours on Tuesday, but eats a different set of meals. He has cereal for breakfast, a 5 sandwiches and 3 bananas for lunch, and pasta for dinner. Birk works 15 hours each day for the rest of the week. If the food Birk eats is on Monday is the same food he eats on Wednesday and Friday, and the food Birk eats on Tuesday is the same food he eats on Thursday. From Monday through Friday, how many fruits has Birk eaten?",
    answers: ["10", "12", "11", "9"]
  },  
  {
  question: "Every day after school, Jordan does activities in a different order. On Monday, Jordan studies, then plays video games, then eats dinner. On Tuesday, Jordan plays video games, then eats dinner, then studies. On Wednesday, Jordan follows the same order as Monday. On Thursday, Jordan follows the same order as Tuesday. On Friday, Jordan studies first and eats dinner last. Which activity does Jordan do right before eating dinner on Wednesday?",
  answers: ["Studying", "Playing video games", "Going to bed", "Watching TV"]
  },
  {
  question: "Lena has three pets: a dog, a cat, and a fish. On Monday, she feeds the dog in the morning and the cat at night. On Tuesday, she feeds the cat in the morning and the fish at night. On Wednesday, she feeds the dog in the morning and the cat at night again. On Thursday, she feeds the cat in the morning and the fish at night again. On Friday, she feeds the dog in the morning and the fish at night. On Saturday, she feeds the same pets as Monday. Which pet is fed at night the most times by the end of the week?",
  answers: ["Dog", "Cat", "Fish", "All equally"]
  },
  {
  question: "In class, Jordan follows a different routine each day. On Monday, Jordan writes notes, then reads a page. On Tuesday, Jordan reads a page, then solves one problem. On Wednesday, Jordan writes notes, then reads a page, and then watches a YouTube video. On Thursday, Jordan reads a page, then solves one problem again. On Friday, Jordan writes notes, then solves one problem, then reads a page. On Saturday and Sunday, Jordan follows the same pattern he does on Monday. How many days total is Jordan's last activity reading a page?",
  answers: ["3", "4", "5", "6"]
  },
];

function setup() {
  // Get DOM elements
  questionTextEl = document.getElementById('question-text');
  answerButtonsEl = document.getElementById('answer-buttons');
  resetBtnEl = document.getElementById('resetBtn');
  pauseBtnEl = document.getElementById('pauseBtn');
  intensitySelectEl = document.getElementById('intensitySelect');
  toastLayerEl = document.getElementById('toastLayer');
  interruptOverlayEl = document.getElementById('interruptOverlay');
  interruptTextEl = document.getElementById('interruptText');
  dismissInterruptBtnEl = document.getElementById('dismissInterruptBtn');
  ambientAudioEl = document.getElementById('adhdAmbientAudio');
  simHudEl = document.getElementById('simHud');
  taskContainerEl = document.getElementById('task-container');
  reflectionCardEl = document.getElementById('reflectionCard');
    if (reflectionCardEl) { reflectionCardEl.hidden = true; }

  // Configure audio settings
  if (ambientAudioEl) {
    ambientAudioEl.volume = 0.2;
  }

  // Set up event listeners
  if (resetBtnEl) {
    resetBtnEl.addEventListener('click', handleReset);
  }

  if (pauseBtnEl) {
    pauseBtnEl.addEventListener('click', handlePause);
  }

  if (intensitySelectEl) {
    intensitySelectEl.addEventListener('change', handleIntensityChange);
  }

  if (dismissInterruptBtnEl) {
    dismissInterruptBtnEl.addEventListener('click', handleDismissInterrupt);
  }

  // Initialize the simulation
  initState();
  handleStart();
}

function initState() {
  hasStarted = false;
  currentQuestionIndex = 0;
  paused = false;
  intensity = 'mild';
  distractionEnabled = false;
  isAdvancingQuestion = false;

  // Clear any existing question
  if (questionTextEl) {
    questionTextEl.textContent = '';
  }
  if (answerButtonsEl) {
    answerButtonsEl.innerHTML = '';
  }

  if (taskContainerEl) {
    taskContainerEl.hidden = false;
  }
  if (simHudEl) {
    simHudEl.hidden = false;
  }
  if (reflectionCardEl) {
    reflectionCardEl.hidden = true;
  }

  // Keep simulation page locked during task phase
  document.body.style.overflow = 'hidden';

  // Clear toasts and interruption
  clearAllToasts();
  hideInterrupt();

  // Stop distraction scheduler
  stopDistractionScheduler();

  // Update UI controls
  updateControlsUI();
}

function updateControlsUI() {
  if (pauseBtnEl) {
    pauseBtnEl.textContent = paused ? 'Resume' : 'Pause';
  }
  if (intensitySelectEl) {
    intensitySelectEl.value = intensity;
  }
}

function handleStart() {
  hasStarted = true;
  distractionEnabled = true;

  // Show first question
  showQuestion();

  // Start distraction scheduler
  startDistractionScheduler();
}

function showQuestion() {
  if (ambientAudioEl && ambientAudioEl.paused && !paused) {
    ambientAudioEl.play().catch(err => {
      console.warn('Audio playback failed:', err);
    });
  }

  if (currentQuestionIndex >= questions.length) {
    // All questions completed
    showCompletionMessage();
    return;
  }

  isAdvancingQuestion = false;

  const currentQuestion = questions[currentQuestionIndex];

  // Display question text
  if (questionTextEl) {
    questionTextEl.textContent = currentQuestion.question;
  }

  // Clear and create answer buttons
  if (answerButtonsEl) {
    answerButtonsEl.innerHTML = '';

    currentQuestion.answers.forEach((answer) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = answer;
      btn.addEventListener('click', () => handleAnswerClick());
      answerButtonsEl.appendChild(btn);
    });
  }
}

function handleAnswerClick() {
  if (isAdvancingQuestion) return;
  isAdvancingQuestion = true;

  // Auto-advance to next question after brief delay
  setTimeout(() => {
    currentQuestionIndex++;
    showQuestion();
  }, 200);
}

function handleReset() {
  currentQuestionIndex = 0;
  // Stop and reset audio
  if (ambientAudioEl) {
    ambientAudioEl.pause();
    ambientAudioEl.currentTime = 0;
  }
  
  initState();
}

function showCompletionMessage() {
  // Stop distractions when completed
  stopDistractionScheduler();
  clearAllToasts();

  if (ambientAudioEl) {
    ambientAudioEl.pause();
  }

  if (taskContainerEl) {
    taskContainerEl.hidden = true;
  }
  if (simHudEl) {
    simHudEl.hidden = true;
  }
  // Navigate to standalone reflection page instead of revealing inline panel
  window.location.href = 'reflection-adhd.html';
}

// Control handlers
function handlePause() {
  paused = !paused;
  
  // Pause/resume audio
  if (ambientAudioEl) {
    if (paused) {
      ambientAudioEl.pause();
    } else {
      ambientAudioEl.play().catch(err => {
        console.warn('Audio playback failed:', err);
      });
    }
  }
  
  updateControlsUI();
}

function handleIntensityChange(e) {
  intensity = e.target.value;
  // Restart scheduler with new intensity
  if (distractionEnabled && hasStarted) {
    stopDistractionScheduler();
    startDistractionScheduler();
  }
}

// Distraction scheduler
function startDistractionScheduler() {
  stopDistractionScheduler();
  
  const now = Date.now();
  nextToastTime = now + getRandomToastInterval();
  nextInterruptTime = now + getRandomInterruptInterval();

  scheduleDistractions();
}

function stopDistractionScheduler() {
  if (toastIntervalId) {
    cancelAnimationFrame(toastIntervalId);
    toastIntervalId = null;
  }
}

function scheduleDistractions() {
  const now = Date.now();
  
  // Only spawn new distractions if not paused and started
  if (!paused && distractionEnabled && hasStarted) {
    // Check if it's time for a toast
    if (now >= nextToastTime) {
      spawnToast();
      nextToastTime = now + getRandomToastInterval();
    }
    
    // Check if it's time for an interruption (and no interruption is currently showing)
    if (now >= nextInterruptTime && !isInterruptVisible()) {
      showInterrupt();
      nextInterruptTime = now + getRandomInterruptInterval();
    }
  }
  
  // Continue the loop
  toastIntervalId = requestAnimationFrame(scheduleDistractions);
}

function isInterruptVisible() {
  if (!interruptOverlayEl) return false;
  if (interruptOverlayEl.classList.contains('hidden')) return false;
  const computedStyle = window.getComputedStyle(interruptOverlayEl);
  return computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
}

function getRandomToastInterval() {
  let min, max;
  
  switch (intensity) {
    case 'strong':
      min = 1500;
      max = 3000;
      break;
    case 'moderate':
      min = 2800;
      max = 5600;
      break;
    case 'mild':
    default:
      min = 9000;
      max = 14000;
      break;
  }
  
  return min + Math.random() * (max - min);
}

function getRandomInterruptInterval() {
  let min, max;
  
  switch (intensity) {
    case 'strong':
      min = 8000;
      max = 15000;
      break;
    case 'moderate':
      min = 14000;
      max = 23000;
      break;
    case 'mild':
    default:
      min = 32000;
      max = 52000;
      break;
  }
  
  return min + Math.random() * (max - min);
}

// Toast management
function spawnToast() {
  if (!toastLayerEl) return;
  
  // Remove oldest toast if we're at max capacity
  if (activeToasts.length >= MAX_TOASTS) {
    const oldestToast = activeToasts.shift();
    if (oldestToast && oldestToast.element) {
      oldestToast.element.remove();
    }
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.backgroundColor = getRandomBrightColor();
  
  const message = toastMessages[Math.floor(Math.random() * toastMessages.length)];
  toast.textContent = message;
  
  toastLayerEl.appendChild(toast);

  triggerScreenShake();
  
  const toastId = toastIdCounter++;
  const toastData = { id: toastId, element: toast };
  activeToasts.push(toastData);
  
  // Auto-remove after duration
  const duration = 3500;
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
    const index = activeToasts.findIndex(t => t.id === toastId);
    if (index > -1) {
      activeToasts.splice(index, 1);
    }
  }, duration);
}

function getRandomBrightColor() {
  const colors = [
    '#FFD166',
    '#FF6B6B',
    '#4D96FF',
    '#6BCB77',
    '#F15BB5',
    '#F7B801',
    '#9B5DE5',
    '#00BBF9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function triggerScreenShake() {
  const root = document.body;
  if (!root || !root.classList) return;
  root.classList.remove('sim-shake');
  void root.offsetWidth;
  root.classList.add('sim-shake');
  setTimeout(() => {
    root.classList.remove('sim-shake');
  }, 260);
}

function clearAllToasts() {
  if (toastLayerEl) {
    toastLayerEl.innerHTML = '';
  }
  activeToasts = [];
}

// Interruption management
function showInterrupt() {
  if (!interruptOverlayEl || !interruptTextEl) return;
  
  const message = interruptMessages[Math.floor(Math.random() * interruptMessages.length)];
  interruptTextEl.textContent = message;
  
  interruptOverlayEl.classList.remove('hidden');
  interruptOverlayEl.style.display = 'flex';
  interruptOverlayEl.style.pointerEvents = 'auto';
}

function hideInterrupt() {
  if (interruptOverlayEl) {
    interruptOverlayEl.classList.add('hidden');
    interruptOverlayEl.style.display = 'none';
    interruptOverlayEl.style.pointerEvents = 'none';
  }
}

function handleDismissInterrupt() {
  hideInterrupt();
  
  // Apply task-switching friction if not paused
  if (!paused && hasStarted) {
    applyTaskSwitchingFriction();
  }
}

// Task-switching friction
function applyTaskSwitchingFriction() {
  const questionCard = document.querySelector('.sim-adhd-page .question-card');
  
  if (!questionCard) return;
  
  // Step 1: Apply visual disruption (blur + dim)
  questionCard.classList.add('task-blur');
  
  // Step 2: Remove blur and apply question highlight after brief delay
  const blurDuration = 400;
  
  setTimeout(() => {
    // Remove blur effect
    questionCard.classList.remove('task-blur');
    
    // Apply re-orientation highlight to question text
    if (questionTextEl) {
      questionTextEl.classList.add('question-highlight');
      
      // Remove highlight after duration
      setTimeout(() => {
        questionTextEl.classList.remove('question-highlight');
      }, 800);
    }
    
  }, blurDuration);
}
