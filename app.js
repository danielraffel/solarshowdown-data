// Solar Showdown - Main Application Logic
console.log('App.js loaded - v2.3 - Using GitHub raw URLs')

// Configuration
const DANIEL_DATA_URL = "https://raw.githubusercontent.com/danielraffel/solarshowdown-data/refs/heads/main/daniel.json"
const STEVE_DATA_URL = "https://raw.githubusercontent.com/danielraffel/solarshowdown-data/refs/heads/main/steve.json"
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

// Initialize the application
function init() {
  // Set today's date
  const today = new Date()
  const dateEl = document.getElementById("today-date")
  if (dateEl) {
    dateEl.textContent = today.toLocaleDateString()
  }

  // Try to show cached data immediately
  const cachedData = localStorage.getItem(CACHE_KEY)
  if (cachedData) {
    try {
      const { data } = JSON.parse(cachedData)
      updateStats(data)
      statsContainer.style.opacity = "1"
    } catch (e) {
      console.warn('Failed to parse cached data:', e)
    }
  }

  // Then fetch fresh data
  fetchAndUpdateData()
}

// Fetch data from GitHub repositories or use mock data
async function fetchAndUpdateData() {
  const timeframe = "daily" // Always use daily

  // Only show loading indicator if we don't have cached data
  const cachedItem = localStorage.getItem(CACHE_KEY)
  if (!cachedItem) {
    loadingIndicator.style.display = "flex"
  }
  errorMessage.style.display = "none"

  try {
    let data

    if (MOCK_MODE) {
      // Use mock data for development
      await simulateNetworkDelay(500)
      data = mockData[timeframe]
    } else {
      // Try to get data from cache first
      const cachedData = await getCachedData()
      if (cachedData) {
        data = cachedData
        console.log('Using cached data')
      } else {
        console.log('Fetching fresh data from GitHub...')
        // Fetch both files in parallel
        const [danielResponse, steveResponse] = await Promise.all([
          fetch(CORS_PROXY + DANIEL_DATA_URL, { cache: 'no-cache' }),
          fetch(CORS_PROXY + STEVE_DATA_URL, { cache: 'no-cache' })
        ])
        
        if (!danielResponse.ok || !steveResponse.ok) {
          throw new Error("Failed to fetch data from GitHub")
        }
        
        const [danielData, steveData] = await Promise.all([
          danielResponse.json(),
          steveResponse.json()
        ])
        
        console.log('Raw data:', { danielData, steveData })
        
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
      
      console.log('Processed data:', data)
    }

    // Update the UI with the fetched data
    updateStats(data)

    // Hide loading state
    loadingIndicator.style.display = "none"
    statsContainer.style.opacity = "1"
  } catch (error) {
    console.error("Error fetching data:", error)
    // Show error message only if we don't have cached data
    loadingIndicator.style.display = "none"
    if (!localStorage.getItem(CACHE_KEY)) {
      errorMessage.style.display = "block"
      statsContainer.style.opacity = "0.5"
    }
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
  updateHighScores(data, danielNet, steveNet)

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
function updateHighScores(data, danielNet, steveNet) {
  // Clear previous content
  highScoresEl.innerHTML = '';
  
  const stats = []
  
  // Net Score Winner (👑)
  const netWinner = danielNet > steveNet ? 'D' : 'S'
  const netScore = danielNet > steveNet ? danielNet : steveNet
  stats.push(`<span>Today's Champion: 👑 ${netWinner}</span>`)
  
  // Generation (🌟)
  const genWinner = data.daniel.generated > data.steve.generated ? 'D' : 'S'
  const genValue = Math.max(data.daniel.generated, data.steve.generated)
  stats.push(`<span>🌟 Gen: ${genValue.toFixed(1)} ${genWinner}</span>`)
  
  // Consumption (🌱) - lower is better
  const conWinner = data.daniel.consumed < data.steve.consumed ? 'D' : 'S'
  const conValue = Math.min(data.daniel.consumed, data.steve.consumed)
  stats.push(`<span>🌱 Con: ${conValue.toFixed(1)} ${conWinner}</span>`)
  
  // Grid Export (💰)
  const soldWinner = data.daniel.soldBack > data.steve.soldBack ? 'D' : 'S'
  const soldValue = Math.max(data.daniel.soldBack, data.steve.soldBack)
  stats.push(`<span>💰 Sold: ${soldValue.toFixed(1)} ${soldWinner}</span>`)
  
  // Grid Import (🔌) - lower is better
  const gridWinner = data.daniel.imported < data.steve.imported ? 'D' : 'S'
  const gridValue = Math.min(data.daniel.imported, data.steve.imported)
  stats.push(`<span>🔌 Grid: ${gridValue.toFixed(1)} ${gridWinner}</span>`)
  
  // Peak Power (⚡)
  const peakWinner = data.daniel.maxPv > data.steve.maxPv ? 'D' : 'S'
  const peakValue = Math.max(data.daniel.maxPv, data.steve.maxPv)
  stats.push(`<span>⚡ MaxPV: ${peakValue.toFixed(1)} ${peakWinner}</span>`)
  
  highScoresEl.innerHTML = stats.join(' ')
}

