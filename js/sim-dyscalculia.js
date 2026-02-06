// Placeholder stub for dyscalculia simulation
let paused = false;
let intensity = 'mild';
let reduceMotion = false;

function initState(){
  paused = false; intensity = 'mild'; reduceMotion = false;
}

function setPaused(v){ paused = !!v; }
function resetSim(){ initState(); }
function setIntensity(v){ intensity = v; }
function setReduceMotion(v){ reduceMotion = !!v; }

document.addEventListener('DOMContentLoaded', ()=>{
  initState();
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const sel = document.getElementById('intensitySelect');
  const rm = document.getElementById('reduceMotion');
  if(pauseBtn) pauseBtn.addEventListener('click', ()=> { setPaused(!paused); pauseBtn.textContent = paused ? 'Resume' : 'Pause'; });
  if(resetBtn) resetBtn.addEventListener('click', ()=> resetSim());
  if(sel) sel.addEventListener('change', (e)=> setIntensity(e.target.value));
  if(rm) rm.addEventListener('change', (e)=> setReduceMotion(e.target.checked));
});
