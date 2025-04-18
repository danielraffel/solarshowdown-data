function showDayDetails(event, day) {
  const isMobile = window.innerWidth <= 768;
  const details = document.querySelector('.day-details');
  const modal = document.querySelector('.modal');
  const modalContent = document.querySelector('.modal-content');

  if (!day.winner) return;

  const content = `
    <h3>${formatDate(day.date)}</h3>
    <div class="stats-grid">
      <div class="stats-column">
        <h4>Winner 🏆</h4>
        <p>${day.winner}</p>
        <h4>Score ⚡️</h4>
        <p>${day.score.toLocaleString()}</p>
      </div>
      <div class="stats-column">
        <h4>High Scores 🎯</h4>
        ${generateHighScoresList(day.highScores)}
      </div>
    </div>
  `;

  if (isMobile) {
    modalContent.innerHTML = content;
    modal.classList.add('visible');
    event.stopPropagation();
  } else {
    details.innerHTML = content;
    const rect = event.target.getBoundingClientRect();
    positionPopup(details, rect);
    details.style.display = 'block';
  }
}

function generateHighScoresList(highScores) {
  return highScores
    .map((score, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎮';
      return `<p>${emoji} ${score.player}: ${score.score.toLocaleString()}</p>`;
    })
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...

  // Close modal when clicking outside or on close button
  const modal = document.querySelector('.modal');
  const closeBtn = document.querySelector('.close-modal');

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('visible');
    }
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('visible');
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const details = document.querySelector('.day-details');
      details.style.display = 'none';
      modal.classList.remove('visible');
    }, 250);
  });
}); 