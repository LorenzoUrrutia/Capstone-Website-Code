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
    // Event delegation for answer buttons
    quizRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('.quiz-choice');
      if (!btn) return;
      const details = btn.closest('details');
      if (!details) return;

      // Remove selection from all buttons in this question
      const buttons = details.querySelectorAll('.quiz-choice');
      buttons.forEach(b => b.classList.remove('selected'));

      // Add selection to clicked button
      btn.classList.add('selected');

      // Auto-advance to next question immediately
      setTimeout(() => {
        // Close current question
        details.open = false;
        
        // Find and open next question
        const currentQ = parseInt(details.getAttribute('data-q'));
        const nextDetails = quizRoot.querySelector(`details[data-q="${currentQ + 1}"]`);
        if (nextDetails) {
          nextDetails.open = true;
          // Smooth scroll to next question
          nextDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300);
    });
  }
});
