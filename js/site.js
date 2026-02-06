// Minimal site JS: smooth anchor scrolling and back-to-top button
document.addEventListener('DOMContentLoaded', () => {
  // Delegate clicks on same-page hash links
  document.body.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    }
  });

  // Back-to-top button
  const back = document.getElementById('backToTop');
  function updateBack() {
    if (!back) return;
    back.classList.toggle('visible', window.scrollY > 300);
  }
  window.addEventListener('scroll', updateBack, { passive: true });
  updateBack();
  if (back) back.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Quiz logic (ADHD page)
  const quizRoot = document.getElementById('quiz');
  if (quizRoot) {
    const scoreEl = document.getElementById('quiz-score');
    const resetBtn = document.getElementById('quiz-reset');
    let score = 0;
    const total = 5;

    function updateScore() {
      if (scoreEl) scoreEl.textContent = `Score: ${score} / ${total}`;
    }

    // Event delegation for answer buttons
    quizRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('.quiz-choice');
      if (!btn) return;
      const details = btn.closest('details');
      if (!details) return;
      // If already locked, ignore
      if (details.dataset.locked === 'true') return;

      const correct = btn.getAttribute('data-correct') === 'true';

      // Lock the question
      details.dataset.locked = 'true';
      // Disable all buttons in this details
      const buttons = details.querySelectorAll('.quiz-choice');
      buttons.forEach(b => b.disabled = true);

      // Show feedback
      const feedback = details.querySelector('.feedback');
      if (feedback) feedback.textContent = correct ? 'Correct' : 'Incorrect';

      if (correct) {
        score += 1;
        updateScore();
      }
    });

    // Reset behavior
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        score = 0;
        updateScore();
        // Unlock all
        const allDetails = quizRoot.querySelectorAll('details');
        allDetails.forEach(d => {
          delete d.dataset.locked;
          const buttons = d.querySelectorAll('.quiz-choice');
          buttons.forEach(b => { b.disabled = false; });
          const feedback = d.querySelector('.feedback');
          if (feedback) feedback.textContent = '';
          // Close details
          d.open = false;
        });
      });
    }
    updateScore();
  }
});
