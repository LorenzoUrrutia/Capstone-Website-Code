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
    function getOrCreateQuizModal() {
      let overlay = document.getElementById('quizFeedbackOverlay');
      if (overlay) return overlay;

      overlay = document.createElement('div');
      overlay.id = 'quizFeedbackOverlay';
      overlay.className = 'quiz-feedback-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Quiz feedback');

      overlay.innerHTML = `
        <div class="quiz-feedback-modal">
          <p id="quizFeedbackSelection"></p>
          <p id="quizFeedbackExplanation"></p>
          <button id="quizFeedbackDoneBtn" class="cta-button" type="button">Done</button>
        </div>
      `;

      document.body.appendChild(overlay);

      const doneBtn = overlay.querySelector('#quizFeedbackDoneBtn');
      if (doneBtn) {
        doneBtn.addEventListener('click', () => {
          overlay.classList.remove('visible');
          document.body.classList.remove('quiz-modal-open');
        });
      }

      return overlay;
    }

    function advanceToNextQuestion(details) {
      details.open = false;
      const currentQ = parseInt(details.getAttribute('data-q'));
      const nextDetails = quizRoot.querySelector(`details[data-q="${currentQ + 1}"]`);
      if (nextDetails) {
        nextDetails.open = true;
        nextDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function showQuizFeedback(details, selectedBtn) {
      const overlay = getOrCreateQuizModal();
      const selectionEl = overlay.querySelector('#quizFeedbackSelection');
      const explanationEl = overlay.querySelector('#quizFeedbackExplanation');
      const doneBtn = overlay.querySelector('#quizFeedbackDoneBtn');

      const selectedLabel = (selectedBtn.dataset.answer || selectedBtn.textContent.trim()).toLowerCase();
      const selectedIsCorrect = selectedBtn.getAttribute('data-correct') === 'true';
      const correctAnswer = (details.dataset.correctAnswer || '').toLowerCase();
      const normalizedCorrectAnswer = correctAnswer === 'true' || correctAnswer === 'false'
        ? correctAnswer
        : null;
      const isCorrect = normalizedCorrectAnswer
        ? selectedLabel === normalizedCorrectAnswer
        : selectedIsCorrect;

      const trueExplanation = details.dataset.trueExplanation || 'Review the statement and compare it to the facts above.';
      const falseExplanation = details.dataset.falseExplanation || 'Review the statement and compare it to the facts above.';
      const selectedExplanation = selectedLabel === 'true' ? trueExplanation : falseExplanation;

      if (selectionEl) {
        selectionEl.innerHTML = `<strong>${isCorrect ? 'Correct.' : 'Incorrect.'}</strong>`;
      }
      if (explanationEl) {
        explanationEl.textContent = selectedExplanation;
      }

      overlay.classList.add('visible');
      document.body.classList.add('quiz-modal-open');
      details.open = true;
      if (doneBtn) doneBtn.focus();
    }

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

      const choice = (btn.dataset.answer || btn.textContent.trim()).toLowerCase();
      const hasTrueFalseExplanations = !!(details.dataset.trueExplanation || details.dataset.falseExplanation);

      if (hasTrueFalseExplanations && (choice === 'true' || choice === 'false')) {
        showQuizFeedback(details, btn);
      } else {
        setTimeout(() => {
          advanceToNextQuestion(details);
        }, 300);
      }
    });
  }
});
