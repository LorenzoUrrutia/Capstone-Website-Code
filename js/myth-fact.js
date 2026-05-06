document.addEventListener('DOMContentLoaded', () => {
  const quizRoot = document.querySelector('.myth-fact-grid');
  if (!quizRoot) return;

  const cards = Array.from(quizRoot.querySelectorAll('.myth-fact-card'));
  if (!cards.length) return;

  let currentIndex = 0;

  function showCard(index) {
    cards.forEach((card) => {
      const button = card.querySelector('.myth-fact-next');
      if (button) button.textContent = 'Next';
    });

    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === index;
      card.classList.toggle('is-active', isActive);
      if (!isActive) {
        card.classList.remove('is-flipped', 'is-correct', 'is-incorrect', 'is-shaking');
      }
    });

    const activeCard = cards[index];
    if (activeCard) {
      const activeNextButton = activeCard.querySelector('.myth-fact-next');
      if (activeNextButton) {
        activeNextButton.textContent = index === cards.length - 1 ? 'Reset' : 'Next';
      }
    }

    currentIndex = index;
  }

  function resetQuiz() {
    cards.forEach((card) => {
      card.classList.remove('is-flipped', 'is-correct', 'is-incorrect', 'is-shaking');
    });
    showCard(0);
  }

  quizRoot.addEventListener('click', (event) => {
    const activeCard = cards[currentIndex];
    if (!activeCard) return;

    const nextButton = event.target.closest('.myth-fact-next');
    if (nextButton && activeCard.contains(nextButton) && activeCard.classList.contains('is-flipped')) {
      if (currentIndex < cards.length - 1) {
        showCard(currentIndex + 1);
      } else {
        resetQuiz();
      }
      return;
    }

    const choiceButton = event.target.closest('.myth-fact-choice');
    if (!choiceButton || !activeCard.contains(choiceButton) || activeCard.classList.contains('is-flipped')) return;

    const selectedChoice = (choiceButton.dataset.choice || '').toLowerCase();
    const correctChoice = (activeCard.dataset.correct || '').toLowerCase();
    const explanation = activeCard.dataset.explanation || '';
    const resultElement = activeCard.querySelector('.myth-fact-result');
    const explanationElement = activeCard.querySelector('.myth-fact-explanation');
    const isCorrect = selectedChoice === correctChoice;

    if (resultElement) {
      resultElement.textContent = isCorrect
        ? `✓ Correct: ${correctChoice === 'myth' ? 'Myth' : 'Fact'}.`
        : `Incorrect. Correct answer: ${correctChoice === 'myth' ? 'Myth' : 'Fact'}.`;
    }

    if (explanationElement) {
      explanationElement.textContent = explanation;
    }

    activeCard.classList.add('is-flipped');
    activeCard.classList.toggle('is-correct', isCorrect);
    activeCard.classList.toggle('is-incorrect', !isCorrect);

    if (!isCorrect) {
      activeCard.classList.add('is-shaking');
      activeCard.addEventListener(
        'animationend',
        () => {
          activeCard.classList.remove('is-shaking');
        },
        { once: true }
      );
    }
  });

  showCard(0);
});
