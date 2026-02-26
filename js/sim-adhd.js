// ADHD Classroom Task Simulation
// State variables
let hasStarted = false;
let currentQuestionIndex = 0;
let paused = false;
let intensity = 'mild';
let distractionEnabled = false;

// DOM elements
let taskContainerEl;
let questionTextEl;
let answerButtonsEl;
let startOverlayEl;
let startBtnEl;
let resetBtnEl;
let pauseBtnEl;
let intensitySelectEl;
let toastLayerEl;
let interruptOverlayEl;
let interruptTextEl;
let dismissInterruptBtnEl;

// Distraction scheduler
let toastIntervalId = null;
let interruptIntervalId = null;
let nextToastTime = 0;
let nextInterruptTime = 0;
let lastFrameTime = 0;
let toastIdCounter = 0;
let activeToasts = [];
const MAX_TOASTS = 3;

// Toast messages pool
const toastMessages = [
  "New message from Luna",
  "Meeting reminder: Team sync in 15 min",
  "Calendar: Math homework due tomorrow",
  "Email: Parent-teacher conference scheduled",
  "Group chat: Anyone have notes from yesterday?",
  "Notification: New assignment posted",
  "Reminder: Library book is overdue",
  "Alert: School assembly at 2pm",
  "Message: Can you send the project file?",
  "Notification: Your ride is here",
  "Calendar: Soccer practice after school",
  "Email: Permission slip needed by Friday",
  "Group chat: Study group meets at 4",
  "Alert: Fire drill scheduled today",
  "Message: Did you finish the reading?"
];

// Interruption messages pool
const interruptMessages = [
  "Your phone is ringing. Do you want to answer?",
  "Someone is knocking at the door.",
  "You just remembered you forgot your lunch.",
  "A loud noise outside caught your attention.",
  "You need to use the bathroom.",
  "Your friend just walked by and waved.",
  "The teacher is making an announcement.",
  "Someone dropped books in the hallway.",
  "You realize you left your assignment at home.",
  "A text notification is buzzing repeatedly."
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
  taskContainerEl = document.getElementById('task-container');
  questionTextEl = document.getElementById('question-text');
  answerButtonsEl = document.getElementById('answer-buttons');
  startOverlayEl = document.getElementById('startOverlay');
  startBtnEl = document.getElementById('startBtn');
  resetBtnEl = document.getElementById('resetBtn');
  pauseBtnEl = document.getElementById('pauseBtn');
  intensitySelectEl = document.getElementById('intensitySelect');
  toastLayerEl = document.getElementById('toastLayer');
  interruptOverlayEl = document.getElementById('interruptOverlay');
  interruptTextEl = document.getElementById('interruptText');
  dismissInterruptBtnEl = document.getElementById('dismissInterruptBtn');

  // Set up event listeners
  if (startBtnEl) {
    startBtnEl.addEventListener('click', handleStart);
  }

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
}

function initState() {
  hasStarted = false;
  currentQuestionIndex = 0;
  paused = false;
  intensity = 'mild';
  distractionEnabled = false;

  document.body.classList.add('pre-start');
  
  // Show start overlay
  if (startOverlayEl) {
    startOverlayEl.style.display = 'flex';
  }

  // Clear any existing question
  if (questionTextEl) {
    questionTextEl.textContent = '';
  }
  if (answerButtonsEl) {
    answerButtonsEl.innerHTML = '';
  }

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

  document.body.classList.remove('pre-start');
  
  // Hide start overlay
  if (startOverlayEl) {
    startOverlayEl.style.display = 'none';
  }

  // Disable intensity selector
  if (intensitySelectEl) {
    intensitySelectEl.disabled = true;
  }

  // Show first question
  showQuestion();

  // Start distraction scheduler
  startDistractionScheduler();
}

function showQuestion() {
  if (currentQuestionIndex >= questions.length) {
    // All questions completed
    showCompletionMessage();
    return;
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Display question text
  if (questionTextEl) {
    questionTextEl.textContent = currentQuestion.question;
  }

  // Clear and create answer buttons
  if (answerButtonsEl) {
    answerButtonsEl.innerHTML = '';

    currentQuestion.answers.forEach((answer, index) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = answer;
      btn.addEventListener('click', () => handleAnswerClick(index));
      answerButtonsEl.appendChild(btn);
    });
  }
}

function handleAnswerClick(answerIndex) {
  // Disable all answer buttons immediately to prevent double-clicks
  if (answerButtonsEl) {
    const buttons = answerButtonsEl.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'not-allowed';
    });
  }

  // Auto-advance to next question after brief delay
  setTimeout(() => {
    currentQuestionIndex++;
    showQuestion();
  }, 200);
}

function handleReset() {
  currentQuestionIndex = 0;
  // Re-enable intensity selector
  if (intensitySelectEl) {
    intensitySelectEl.disabled = false;
  }
  initState();
}

function showCompletionMessage() {
  if (questionTextEl) {
    questionTextEl.textContent = "All questions completed!";
  }

  if (answerButtonsEl) {
    answerButtonsEl.innerHTML = '';
  }

  // Stop distractions when completed
  stopDistractionScheduler();
  clearAllToasts();
}

// Control handlers
function handlePause() {
  paused = !paused;
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
  
  lastFrameTime = now;
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
    if (now >= nextInterruptTime && interruptOverlayEl && interruptOverlayEl.style.display === 'none') {
      showInterrupt();
      nextInterruptTime = now + getRandomInterruptInterval();
    }
  }
  
  // Continue the loop
  toastIntervalId = requestAnimationFrame(scheduleDistractions);
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
      min = 5600;
      max = 9500;
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
      min = 23000;
      max = 38000;
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
  
  interruptOverlayEl.style.display = 'flex';
  
  // Disable answer buttons and next button
  disableInteraction();
}

function hideInterrupt() {
  if (interruptOverlayEl) {
    interruptOverlayEl.style.display = 'none';
  }
  
  // Re-enable answer buttons and next button
  enableInteraction();
}

function handleDismissInterrupt() {
  hideInterrupt();
  
  // Apply task-switching friction if not paused
  if (!paused && hasStarted) {
    applyTaskSwitchingFriction();
  }
}

function disableInteraction() {
  // Disable answer buttons
  if (answerButtonsEl) {
    const buttons = answerButtonsEl.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  }
}

function enableInteraction() {
  // Enable answer buttons
  if (answerButtonsEl) {
    const buttons = answerButtonsEl.querySelectorAll('.answer-btn');
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
    });
  }
}

// Task-switching friction
function applyTaskSwitchingFriction() {
  const questionCard = document.querySelector('.sim-adhd-page .question-card');
  
  if (!questionCard) return;
  
  // Step 1: Apply visual disruption (blur + dim)
  questionCard.classList.add('task-blur');
  
  // Keep buttons disabled during re-orientation
  const buttons = answerButtonsEl?.querySelectorAll('.answer-btn');
  buttons?.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  });
  
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
    
    // Step 3: Re-enable answer buttons after input friction delay
    setTimeout(() => {
      buttons?.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
      });
    }, 400);
    
  }, blurDuration);
}
