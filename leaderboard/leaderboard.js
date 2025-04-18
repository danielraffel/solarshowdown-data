let leaderboardData = [];
let currentDate = new Date();
let minDate = null;
let maxDate = null;

// Fetch and process leaderboard data
async function fetchLeaderboardData() {
  try {
    const response = await fetch('daily-leaderboard.json');
    leaderboardData = await response.json();
    console.log('Fetched leaderboard data:', leaderboardData);
    
    // Find min and max dates from data
    if (leaderboardData.length > 0) {
      const dates = leaderboardData.map(d => new Date(d.date));
      minDate = new Date(Math.min.apply(null, dates));
      maxDate = new Date(Math.max.apply(null, dates));
      
      // Set current date to latest available data month
      currentDate = new Date(maxDate);
    }
    
    updateChampionshipStats();
    renderCalendar();
    updateNavigationButtons();
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
  }
}

// Update championship statistics
function updateChampionshipStats() {
  const stats = leaderboardData.reduce((acc, day) => {
    if (day.winner === 'Daniel') acc.daniel++;
    else if (day.winner === 'Steve') acc.steve++;
    return acc;
  }, { daniel: 0, steve: 0 });

  document.getElementById('daniel-wins').textContent = stats.daniel;
  document.getElementById('steve-wins').textContent = stats.steve;
  
  const overallChampion = stats.daniel === stats.steve ? 'Tied' :
    stats.daniel > stats.steve ? 'Daniel 👑' : 'Steve 👑';
  document.getElementById('overall-champion').textContent = overallChampion;
}

// Update navigation button states
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  
  if (!minDate || !maxDate) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }
  
  const currentYearMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const minYearMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const maxYearMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  
  prevBtn.disabled = currentYearMonth <= minYearMonth;
  nextBtn.disabled = currentYearMonth >= maxYearMonth;
}

// Calendar navigation
document.getElementById('prev-month').addEventListener('click', () => {
  if (minDate) {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const minYearMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    if (newDate >= minYearMonth) {
      currentDate = newDate;
      renderCalendar();
      updateNavigationButtons();
    }
  }
});

document.getElementById('next-month').addEventListener('click', () => {
  if (maxDate) {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const maxYearMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    
    if (newDate <= maxYearMonth) {
      currentDate = newDate;
      renderCalendar();
      updateNavigationButtons();
    }
  }
});

// Render calendar
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Update month/year display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();
  
  const calendarGrid = document.getElementById('calendar-grid');
  calendarGrid.innerHTML = '';
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < startingDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDay);
  }
  
  // Add days of the month
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = leaderboardData.find(d => d.date === dateStr);
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (dayData) {
      console.log('Found data for', dateStr, dayData);
      dayElement.classList.add(dayData.winner.toLowerCase());
      dayElement.innerHTML = `
        <div class="date">${day}</div>
        <div class="winner">${dayData.winner.charAt(0)}</div>
      `;
      
      // Add hover functionality
      dayElement.addEventListener('mouseover', (e) => {
        console.log('Showing details for:', dateStr, dayData);
        showDayDetails(e, dayData);
      });
      dayElement.addEventListener('mouseout', hideDayDetails);
      // Add tap/click for mobile
      dayElement.addEventListener('click', (e) => {
        showDayDetails(e, dayData);
      });
    } else {
      dayElement.innerHTML = `<div class="date">${day}</div>`;
    }
    
    calendarGrid.appendChild(dayElement);
  }
  updateMonthlyChampion();
}

// Show day details on hover
function showDayDetails(event, data) {
  const isMobile = window.innerWidth <= 768;
  const details = document.getElementById('day-details');
  const modal = document.getElementById('details-modal');
  const modalBody = modal.querySelector('.modal-body');
  
  // Create stats table with winner emoji
  const statRows = [
    {
      key: 'generated', label: 'Generated', unit: 'kWh', highScore: 'generatedMore', emoji: '🌟'
    },
    {
      key: 'consumed', label: 'Consumed', unit: 'kWh', highScore: 'consumedLess', emoji: '🌱'
    },
    {
      key: 'exported', label: 'Exported', unit: 'kWh', highScore: 'soldMore', emoji: '💰'
    },
    {
      key: 'imported', label: 'Imported', unit: 'kWh', highScore: 'importedLess', emoji: '🔌'
    },
    {
      key: 'discharged', label: 'Discharged', unit: 'kWh', highScore: 'dischargedLess', emoji: '🪫'
    },
    {
      key: 'maxPv', label: 'Max PV', unit: 'kW', highScore: 'highestMaxPv', emoji: '⚡'
    },
    {
      key: 'net', label: 'Net', unit: 'kWh', highScore: null, emoji: ''
    }
  ];

  const statsTableRows = statRows.map(row => {
    const danielVal = data.daniel[row.key].toFixed(1) + ' ' + row.unit;
    const steveVal = data.steve[row.key].toFixed(1) + ' ' + row.unit;
    let danielEmoji = '', steveEmoji = '';
    if (row.highScore && data.highScores && data.highScores[row.highScore]) {
      const winner = data.highScores[row.highScore].winner;
      if (winner === 'Daniel') danielEmoji = ' ' + row.emoji;
      else if (winner === 'Steve') steveEmoji = ' ' + row.emoji;
      else if (winner === 'Tied') danielEmoji = steveEmoji = ' 🤝';
    }
    return `<tr><td>${row.label}</td><td>${danielVal}${danielEmoji}</td><td>${steveVal}${steveEmoji}</td></tr>`;
  }).join('');

  const statsHtml = `
    <table class="stats-table">
      <thead><tr><th>Stat</th><th style="color:var(--color-daniel)">Daniel</th><th style="color:var(--color-steve)">Steve</th></tr></thead>
      <tbody>${statsTableRows}</tbody>
    </table>
  `;

  const contentHtml = `
    <div class="details-header">
      <strong>${data.date}</strong>
      <div class="winner-badge">
        🏆 Winner: <span style="color: var(--color-${data.winner.toLowerCase()})">${data.winner}</span>
      </div>
    </div>
    <div class="details-section">
      <h3>Daily Stats</h3>
      ${statsHtml}
    </div>
  `;

  if (isMobile) {
    modalBody.innerHTML = contentHtml;
    modal.classList.add('visible');
  } else {
    details.innerHTML = contentHtml;
    
    const rect = event.target.getBoundingClientRect();
    const detailsRect = details.getBoundingClientRect();
    
    // Position the popup, ensuring it stays within viewport
    let left = rect.left;
    let top = rect.bottom + 10;
    
    // Adjust horizontal position if needed
    if (left + detailsRect.width > window.innerWidth) {
      left = window.innerWidth - detailsRect.width - 10;
    }
    
    // Adjust vertical position if needed
    if (top + detailsRect.height > window.innerHeight) {
      top = rect.top - detailsRect.height - 10;
    }
    
    details.style.top = `${top}px`;
    details.style.left = `${left}px`;
    details.classList.add('visible');
  }
}

function hideDayDetails() {
  const details = document.getElementById('day-details');
  details.classList.remove('visible');
}

// Calculate and display the monthly champion
function updateMonthlyChampion() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  let danielWins = 0, steveWins = 0;
  leaderboardData.forEach(day => {
    const d = new Date(day.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (day.winner === 'Daniel') danielWins++;
      else if (day.winner === 'Steve') steveWins++;
    }
  });
  let champion = 'Tied';
  if (danielWins > steveWins) champion = 'Daniel 👑';
  else if (steveWins > danielWins) champion = 'Steve 👑';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const el = document.getElementById('overall-champion');
  if (el) {
    el.textContent = `Champion for ${monthNames[month]} ${year}: ${champion}`;
  }
  // Remove the old monthly-champion element if it exists
  const oldMonthly = document.getElementById('monthly-champion');
  if (oldMonthly) oldMonthly.style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing leaderboard...');
  fetchLeaderboardData();

  const modal = document.getElementById('details-modal');
  const closeBtn = modal.querySelector('.close-modal');

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('visible');
  });

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('visible');
    }
  });
});
