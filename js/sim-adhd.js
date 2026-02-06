// Stub for ADHD simulation controls and state (no drawing logic yet)
let simState = {
  paused: false,
  intensity: 'mild',
  reduceMotion: false
};

function initState() {
  simState = { paused: false, intensity: 'mild', reduceMotion: false };
  updateUI();
  console.log('sim: initState', simState);
}

function setPaused(val) {
  simState.paused = !!val;
  updateUI();
  console.log('sim: paused=', simState.paused);
}

function resetSim() {
  initState();
  console.log('sim: reset');
}

function setIntensity(val) {
  simState.intensity = val;
  console.log('sim: intensity=', val);
}

function setReduceMotion(val) {
  simState.reduceMotion = !!val;
  console.log('sim: reduceMotion=', simState.reduceMotion);
}

function updateUI(){
  const pauseBtn = document.getElementById('pauseBtn');
  if(pauseBtn) pauseBtn.textContent = simState.paused ? 'Resume' : 'Pause';
  const intensity = document.getElementById('intensitySelect');
  if(intensity) intensity.value = simState.intensity;
  const rm = document.getElementById('reduceMotion');
  if(rm) rm.checked = !!simState.reduceMotion;
}

document.addEventListener('DOMContentLoaded', ()=>{
  initState();
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const intensity = document.getElementById('intensitySelect');
  const rm = document.getElementById('reduceMotion');

  if(pauseBtn) pauseBtn.addEventListener('click', ()=> setPaused(!simState.paused));
  if(resetBtn) resetBtn.addEventListener('click', ()=> resetSim());
  if(intensity) intensity.addEventListener('change', (e)=> setIntensity(e.target.value));
  if(rm) rm.addEventListener('change', (e)=> setReduceMotion(e.target.checked));

  // Placeholder: p5 sketch would be created here and react to simState.
});
