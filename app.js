// Solar Showdown - Main Application Logic
console.log('App.js loaded - v2.3 - Using GitHub raw URLs')

// Configuration
const DANIEL_DATA_URL = "https://raw.githubusercontent.com/danielraffel/solarshowdown-data/main/daniel.json"
const STEVE_DATA_URL = "https://raw.githubusercontent.com/danielraffel/solarshowdown-data/main/steve.json"
// Use a CORS proxy to avoid cross-origin issues
const CORS_PROXY = "https://corsproxy.io/?" // Alternative: "https://cors-anywhere.herokuapp.com/"
// Set to true for local testing, false when GitHub data should be used
const MOCK_MODE = false 
const CACHE_KEY = 'solar-showdown-data'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

// DOM Elements
const loadingIndicator = document.getElementById("loading")
const errorMessage = document.getElementById("error-message")
const statsContainer = document.getElementById("stats-container")
const highScoresEl = document.getElementById("high-scores")
const todayDateEl = document.getElementById("today-date")
const championEl = document.getElementById("todays-champion")

// Daniel elements
const danielGeneratedEl = document.getElementById("daniel-generated")
const danielConsumedEl = document.getElementById("daniel-consumed")
const danielSoldEl = document.getElementById("daniel-sold")
const danielNetEl = document.getElementById("daniel-net")
const danielWinnerBadge = document.getElementById("daniel-winner")
const danielGeneratedBadge = document.getElementById("daniel-generated-badge")
const danielConsumedBadge = document.getElementById("daniel-consumed-badge")
const danielSoldBadge = document.getElementById("daniel-sold-badge")

// Steve elements
const steveGeneratedEl = document.getElementById("steve-generated")
const steveConsumedEl = document.getElementById("steve-consumed")
const steveSoldEl = document.getElementById("steve-sold")
const steveNetEl = document.getElementById("steve-net")
const steveWinnerBadge = document.getElementById("steve-winner")
const steveGeneratedBadge = document.getElementById("steve-generated-badge")
const steveConsumedBadge = document.getElementById("steve-consumed-badge")
const steveSoldBadge = document.getElementById("steve-sold-badge")

// Bonus category elements
const solarMvpEl = document.getElementById("solar-mvp")
const gridHustlerEl = document.getElementById("grid-hustler")
const energyVampireEl = document.getElementById("energy-vampire")
const batteryBossEl = document.getElementById("battery-boss")
const peakPerformerEl = document.getElementById("peak-performer")

// Mock data for development (when API is not available)
const mockData = {
  daily: {
    daniel: {
      generated: 21.8,
      consumed: 14.2,
      soldBack: 8.3,
      imported: 1.2,
      discharged: 2.1,
      maxPv: 5.5,
    },
    steve: {
      generated: 19.5,
      consumed: 16.7,
      soldBack: 5.2,
      imported: 1.5,
      discharged: 1.8,
      maxPv: 4.9,
    },
  },
  weekly: {
    daniel: {
      generated: 142.5,
      consumed: 98.3,
      soldBack: 52.7,
      imported: 7.5,
      discharged: 12.2,
      maxPv: 7.8,
    },
    steve: {
      generated: 156.2,
      consumed: 112.8,
      soldBack: 48.9,
      imported: 8.1,
      discharged: 10.5,
      maxPv: 7.2,
    },
  },
  monthly: {
    daniel: {
      generated: 587.3,
      consumed: 412.6,
      soldBack: 201.4,
      imported: 32.1,
      discharged: 48.7,
      maxPv: 9.2,
    },
    steve: {
      generated: 602.8,
      consumed: 435.1,
      soldBack: 189.7,
      imported: 35.4,
      discharged: 44.3,
      maxPv: 8.7,
    },
  },
  yearly: {
    daniel: {
      generated: 6842.5,
      consumed: 4987.2,
      soldBack: 2314.8,
      imported: 410.2,
      discharged: 590.1,
      maxPv: 12.3,
    },
    steve: {
      generated: 7105.3,
      consumed: 5243.9,
      soldBack: 2198.6,
      imported: 430.7,
      discharged: 570.8,
      maxPv: 11.8,
    },
  },
}

// Set today's date immediately
const today = new Date()
const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
if (todayDateEl) {
  todayDateEl.textContent = today.toLocaleDateString('en-US', options)
}

// Initialize the application
function init() {
  // Hide error message initially
  if (errorMessage) errorMessage.style.display = "none"
  if (statsContainer) statsContainer.style.opacity = "1"

  // Try to show cached data immediately
  const cachedData = localStorage.getItem(CACHE_KEY)
  if (cachedData) {
    try {
      const { data } = JSON.parse(cachedData)
      updateStats(data)
    } catch (e) {
      console.warn('Failed to parse cached data:', e)
    }
  }

  // Then fetch fresh data
  fetchAndUpdateData()
}

// Fetch data from GitHub repositories or use mock data
async function fetchAndUpdateData() {
  if (loadingIndicator) loadingIndicator.style.display = "flex"
  if (errorMessage) errorMessage.style.display = "none"
  if (statsContainer) statsContainer.style.opacity = "1"

  try {
    let data

    if (MOCK_MODE) {
      // Use mock data for development
      await simulateNetworkDelay(500)
      data = mockData.daily
      console.log('Using mock data:', data)
    } else {
      // Fetch both files in parallel
      const [danielResponse, steveResponse] = await Promise.all([
        fetch(DANIEL_DATA_URL),
        fetch(STEVE_DATA_URL)
      ])
      
      if (!danielResponse.ok || !steveResponse.ok) {
        throw new Error("Failed to fetch data from GitHub")
      }
      
      const [danielData, steveData] = await Promise.all([
        danielResponse.json(),
        steveResponse.json()
      ])
      
      data = {
        daniel: {
          generated: danielData.generated || 0,
          consumed: danielData.consumed || 0,
          soldBack: danielData.exported || 0,
          imported: danielData.imported || 0,
          discharged: danielData.discharged || 0,
          maxPv: danielData.maxPv || 0
        },
        steve: {
          generated: steveData.generated || 0,
          consumed: steveData.consumed || 0,
          soldBack: steveData.exported || 0,
          imported: steveData.imported || 0,
          discharged: steveData.discharged || 0,
          maxPv: steveData.maxPv || 0
        }
      }

      // Cache the fetched data
      await cacheData(data)
    }

    // Update the UI with the fetched data
    updateStats(data)

    // Hide loading state
    if (loadingIndicator) loadingIndicator.style.display = "none"
    if (errorMessage) errorMessage.style.display = "none"
    if (statsContainer) statsContainer.style.opacity = "1"
  } catch (error) {
    console.error("Error fetching data:", error)
    if (loadingIndicator) loadingIndicator.style.display = "none"
    if (errorMessage) errorMessage.style.display = "block"
    if (statsContainer) statsContainer.style.opacity = "0.5"
  }
}

// Cache management functions
async function getCachedData() {
  try {
    const cachedItem = localStorage.getItem(CACHE_KEY)
    if (!cachedItem) return null

    const { timestamp, data } = JSON.parse(cachedItem)
    const now = Date.now()

    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  } catch (e) {
    console.warn('Cache read error:', e)
    localStorage.removeItem(CACHE_KEY)
    return null
  }
}

async function cacheData(data) {
  try {
    const cacheItem = {
      timestamp: Date.now(),
      data
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheItem))
  } catch (e) {
    console.warn('Cache write error:', e)
  }
}

// Update the statistics display
function updateStats(data) {
  if (!data || !data.daniel || !data.steve) {
    console.warn('Missing data for updateStats:', data)
    return
  }

  // Calculate net scores
  const danielNet = calculateNetScore(data.daniel)
  const steveNet = calculateNetScore(data.steve)

  // Update high scores summary first
  updateHighScores(data)

  // Update display values
  danielGeneratedEl.textContent = `${data.daniel.generated.toFixed(1)} kWh`
  danielConsumedEl.textContent = `${data.daniel.consumed.toFixed(1)} kWh`
  danielSoldEl.textContent = `${data.daniel.soldBack.toFixed(1)} kWh`
  danielNetEl.textContent = `${danielNet.toFixed(1)} kWh`

  const danielImportedEl = document.getElementById("daniel-imported")
  if (danielImportedEl) danielImportedEl.textContent = `${data.daniel.imported.toFixed(1)} kWh`
  
  const danielDischargedEl = document.getElementById("daniel-discharged")
  if (danielDischargedEl) danielDischargedEl.textContent = `${data.daniel.discharged.toFixed(1)} kWh`
  
  const danielMaxpvEl = document.getElementById("daniel-maxpv")
  if (danielMaxpvEl) danielMaxpvEl.textContent = `${data.daniel.maxPv.toFixed(1)} kW`

  steveGeneratedEl.textContent = `${data.steve.generated.toFixed(1)} kWh`
  steveConsumedEl.textContent = `${data.steve.consumed.toFixed(1)} kWh`
  steveSoldEl.textContent = `${data.steve.soldBack.toFixed(1)} kWh`
  steveNetEl.textContent = `${steveNet.toFixed(1)} kWh`

  const steveImportedEl = document.getElementById("steve-imported")
  if (steveImportedEl) steveImportedEl.textContent = `${data.steve.imported.toFixed(1)} kWh`
  
  const steveDischargedEl = document.getElementById("steve-discharged")
  if (steveDischargedEl) steveDischargedEl.textContent = `${data.steve.discharged.toFixed(1)} kWh`
  
  const steveMaxpvEl = document.getElementById("steve-maxpv")
  if (steveMaxpvEl) steveMaxpvEl.textContent = `${data.steve.maxPv.toFixed(1)} kW`

  // Determine winner
  determineWinner(danielNet, steveNet)

  // Update bonus categories
  updateBonusCategories(data)

  // Update badges
  updateBadges(data)
}

// Calculate net score
function calculateNetScore(userData) {
  return userData.generated + userData.soldBack - userData.consumed
}

// Determine the winner based on net scores
function determineWinner(danielNet, steveNet) {
  // Reset previous winner styling
  document.querySelector(".stats-card.daniel").classList.remove("winner")
  document.querySelector(".stats-card.steve").classList.remove("winner")
  danielWinnerBadge.style.display = "none"
  steveWinnerBadge.style.display = "none"

  if (danielNet > steveNet) {
    // Daniel wins
    danielWinnerBadge.style.display = "inline"
    document.querySelector(".stats-card.daniel").classList.add("winner")
  } else if (steveNet > danielNet) {
    // Steve wins
    steveWinnerBadge.style.display = "inline"
    document.querySelector(".stats-card.steve").classList.add("winner")
  } else {
    // It's a tie - both win
    danielWinnerBadge.style.display = "inline"
    steveWinnerBadge.style.display = "inline"
  }
}

// Update bonus categories
function updateBonusCategories(data) {
  // Solar MVP
  solarMvpEl.textContent = 
    data.daniel.generated > data.steve.generated ? 'Daniel' : 'Steve'
    
  // Grid Hustler
  gridHustlerEl.textContent = 
    data.daniel.soldBack > data.steve.soldBack ? 'Daniel' : 'Steve'
    
  // Energy Vampire
  energyVampireEl.textContent = 
    data.daniel.consumed > data.steve.consumed ? 'Daniel' : 'Steve'
    
  // Battery Boss
  batteryBossEl.textContent = 
    data.daniel.discharged > data.steve.discharged ? 'Daniel' : 'Steve'
    
  // Peak Performer
  peakPerformerEl.textContent = 
    data.daniel.maxPv > data.steve.maxPv ? 'Daniel' : 'Steve'
}

// Update badges for stats
function updateBadges(data) {
  // Reset all badges
  danielGeneratedBadge.style.display = "none"
  danielConsumedBadge.style.display = "none"
  danielSoldBadge.style.display = "none"
  steveGeneratedBadge.style.display = "none"
  steveConsumedBadge.style.display = "none"
  steveSoldBadge.style.display = "none"

  // New fields
  const danielImportedBadge = document.getElementById("daniel-imported-badge")
  const steveImportedBadge = document.getElementById("steve-imported-badge")
  const danielDischargedBadge = document.getElementById("daniel-discharged-badge")
  const steveDischargedBadge = document.getElementById("steve-discharged-badge")
  const danielMaxpvBadge = document.getElementById("daniel-maxpv-badge")
  const steveMaxpvBadge = document.getElementById("steve-maxpv-badge")
  
  if (danielImportedBadge) danielImportedBadge.style.display = "none"
  if (steveImportedBadge) steveImportedBadge.style.display = "none"
  if (danielDischargedBadge) danielDischargedBadge.style.display = "none"
  if (steveDischargedBadge) steveDischargedBadge.style.display = "none"
  if (danielMaxpvBadge) danielMaxpvBadge.style.display = "none"
  if (steveMaxpvBadge) steveMaxpvBadge.style.display = "none"

  // Set badges for generated
  if (data.daniel.generated > data.steve.generated) {
    danielGeneratedBadge.textContent = "🌟"
    danielGeneratedBadge.style.display = "block"
  } else if (data.steve.generated > data.daniel.generated) {
    steveGeneratedBadge.textContent = "🌟"
    steveGeneratedBadge.style.display = "block"
  }

  // Sold back
  if (data.daniel.soldBack > data.steve.soldBack) {
    danielSoldBadge.textContent = "💰"
    danielSoldBadge.style.display = "block"
  } else if (data.steve.soldBack > data.daniel.soldBack) {
    steveSoldBadge.textContent = "💰"
    steveSoldBadge.style.display = "block"
  }

  // Consumed (lower is better)
  if (data.daniel.consumed < data.steve.consumed) {
    danielConsumedBadge.textContent = "🌱"
    danielConsumedBadge.style.display = "block"
  } else if (data.steve.consumed < data.daniel.consumed) {
    steveConsumedBadge.textContent = "🌱"
    steveConsumedBadge.style.display = "block"
  }

  // Imported (lower is better)
  if (danielImportedBadge && steveImportedBadge) {
    if (data.daniel.imported < data.steve.imported) {
      danielImportedBadge.textContent = "🔌"
      danielImportedBadge.style.display = "block"
    } else if (data.steve.imported < data.daniel.imported) {
      steveImportedBadge.textContent = "🔌"
      steveImportedBadge.style.display = "block"
    } else if (data.daniel.imported === data.steve.imported) {
      danielImportedBadge.textContent = "🤝"
      steveImportedBadge.textContent = "🤝"
      danielImportedBadge.style.display = "block"
      steveImportedBadge.style.display = "block"
    }
  }

  // Discharged (lower is better)
  if (danielDischargedBadge && steveDischargedBadge) {
    if (data.daniel.discharged < data.steve.discharged) {
      danielDischargedBadge.textContent = "🪫"
      danielDischargedBadge.style.display = "block"
    } else if (data.steve.discharged < data.daniel.discharged) {
      steveDischargedBadge.textContent = "🪫"
      steveDischargedBadge.style.display = "block"
    } else if (data.daniel.discharged === data.steve.discharged) {
      danielDischargedBadge.textContent = "🤝"
      steveDischargedBadge.textContent = "🤝"
      danielDischargedBadge.style.display = "block"
      steveDischargedBadge.style.display = "block"
    }
  }

  // Max PV (higher is better)
  if (danielMaxpvBadge && steveMaxpvBadge) {
    if (data.daniel.maxPv > data.steve.maxPv) {
      danielMaxpvBadge.textContent = "☀️"
      danielMaxpvBadge.style.display = "block"
    } else if (data.steve.maxPv > data.daniel.maxPv) {
      steveMaxpvBadge.textContent = "☀️"
      steveMaxpvBadge.style.display = "block"
    } else if (data.daniel.maxPv === data.steve.maxPv) {
      danielMaxpvBadge.textContent = "🤝"
      steveMaxpvBadge.textContent = "🤝"
      danielMaxpvBadge.style.display = "block"
      steveMaxpvBadge.style.display = "block"
    }
  }
}

// Helper function to simulate network delay for mock data
function simulateNetworkDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", init)

// Handle errors gracefully
window.addEventListener("error", (event) => {
  console.error("Application error:", event.error)
  errorMessage.style.display = "block"
  loadingIndicator.style.display = "none"
})

// Add test function at the bottom of the file
async function testDataProcessing() {
  console.log('Testing data processing...')
  
  // Test with known good data
  const testData = {
    daniel: {
      generated: 29.899999618530273,
      consumed: 26.799999237060547,
      exported: 0.10000000149011612,
      imported: 0.10000000149011612,
      discharged: 8,
      maxPv: 11.567
    },
    steve: {
      generated: 33.09999990463257,
      consumed: 10.40000019222498,
      exported: 19.399999618530273,
      imported: 0.10000000149011612,
      discharged: 4.099999904632568,
      maxPv: 9.97
    }
  }
  
  console.log('Test data:', testData)
  
  try {
    // Process the data like we would from fetch
    const processedData = {
      daniel: {
        generated: testData.daniel.generated ?? 0,
        consumed: testData.daniel.consumed ?? 0,
        soldBack: testData.daniel.exported ?? 0,
        imported: testData.daniel.imported ?? 0,
        discharged: testData.daniel.discharged ?? 0,
        maxPv: testData.daniel.maxPv ?? 0
      },
      steve: {
        generated: testData.steve.generated ?? 0,
        consumed: testData.steve.consumed ?? 0,
        soldBack: testData.steve.exported ?? 0,
        imported: testData.steve.imported ?? 0,
        discharged: testData.steve.discharged ?? 0,
        maxPv: testData.steve.maxPv ?? 0
      }
    }
    
    console.log('Processed test data:', processedData)
    
    // Try updating the UI
    updateStats(processedData)
    console.log('UI update complete')
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Call test after a delay to let page load
setTimeout(testDataProcessing, 2000)

// Add new function for high scores summary
function updateHighScores(data) {
  const highScoresDiv = document.querySelector('.high-scores');
  highScoresDiv.innerHTML = '';

  // Calculate winners
  const danielNetScore = data.daniel.generated - data.daniel.consumed;
  const steveNetScore = data.steve.generated - data.steve.consumed;
  const mvpWinner = danielNetScore > steveNetScore ? 'Daniel' : 'Steve';

  // Update champion display
  if (championEl) {
    championEl.textContent = `Today's Champion 🏆 ${mvpWinner}`;
  }

  const genWinner = data.daniel.generated > data.steve.generated ? 'Daniel' : 'Steve';
  const genValue = Math.max(data.daniel.generated, data.steve.generated);

  const conWinner = data.daniel.consumed < data.steve.consumed ? 'Daniel' : 'Steve';
  const conValue = Math.min(data.daniel.consumed, data.steve.consumed);

  // Update meta descriptions for social sharing
  const description = `Today's Solar Champion is ${mvpWinner}! 🏆 Generated: ${genValue.toFixed(1)} kWh, Consumed: ${conValue.toFixed(1)} kWh`;
  
  const ogDescription = document.getElementById('og-description');
  const twitterDescription = document.getElementById('twitter-description');
  
  if (ogDescription) ogDescription.content = description;
  if (twitterDescription) twitterDescription.content = description;

  const gridExportWinner = data.daniel.soldBack > data.steve.soldBack ? 'Daniel' : 'Steve';
  const gridExportValue = Math.max(data.daniel.soldBack, data.steve.soldBack);

  const gridImportWinner = data.daniel.imported < data.steve.imported ? 'Daniel' : 'Steve';
  const gridImportValue = Math.min(data.daniel.imported, data.steve.imported);

  const batteryWinner = data.daniel.discharged > data.steve.discharged ? 'Daniel' : 'Steve';
  const batteryValue = Math.max(data.daniel.discharged, data.steve.discharged);

  const peakPowerWinner = data.daniel.maxPv > data.steve.maxPv ? 'Daniel' : 'Steve';
  const peakPowerValue = Math.max(data.daniel.maxPv, data.steve.maxPv);

  // Update high scores display
  const stats = [
    { label: 'Generated 🌟', value: `${genValue.toFixed(1)} kWh - ${genWinner}` },
    { label: 'Consumed 🌱', value: `${conValue.toFixed(1)} kWh - ${conWinner}` },
    { label: 'Sold to Grid ⚡', value: `${gridExportValue.toFixed(1)} kWh - ${gridExportWinner}` },
    { label: 'Imported from Grid 🔌', value: `${gridImportValue.toFixed(1)} kWh - ${gridImportWinner}` },
    { label: 'Battery Discharge 🪫', value: `${batteryValue.toFixed(1)} kWh - ${batteryWinner}` },
    { label: 'Peak Power ⚡', value: `${peakPowerValue.toFixed(1)} kW - ${peakPowerWinner}` }
  ];

  stats.forEach(stat => {
    const div = document.createElement('div');
    div.className = 'high-score-item';
    div.innerHTML = `
      <span class="label">${stat.label}</span>
      <span class="value">${stat.value}</span>
    `;
    highScoresDiv.appendChild(div);
  });

  // Update net champion in bonus categories
  const netChampionDiv = document.querySelector('.bonus-grid .bonus-item:last-child .bonus-winner');
  if (netChampionDiv) {
    netChampionDiv.textContent = mvpWinner;
  }
}

