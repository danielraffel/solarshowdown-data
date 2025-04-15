// Solar Showdown - Main Application Logic
console.log('App.js loaded - v2.1 - Fixed data source')

// Use a CORS proxy to avoid cross-origin issues
const CORS_PROXY = "" // Remove CORS proxy since we're serving from same domain
// Data URLs
const DANIEL_DATA_URL = `daniel.json` // Local file path
const STEVE_DATA_URL = `steve.json` // Local file path
// Set to true for local testing, false when GitHub data should be used
const MOCK_MODE = false 

// DOM Elements
const loadingIndicator = document.getElementById("loading")
const errorMessage = document.getElementById("error-message")
const statsContainer = document.getElementById("stats-container")

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
  fetchAndUpdateData()
}

// Fetch data from GitHub repositories or use mock data
async function fetchAndUpdateData() {
  const timeframe = "daily" // Always use daily

  // Show loading state
  loadingIndicator.style.display = "flex"
  statsContainer.style.opacity = "0.5"
  errorMessage.style.display = "none"

  try {
    let data

    if (MOCK_MODE) {
      console.log('Using mock data')
      await simulateNetworkDelay(500)
      data = mockData[timeframe]
    } else {
      console.log('Starting fetch from:', { 
        danielUrl: DANIEL_DATA_URL, 
        steveUrl: STEVE_DATA_URL,
        absolute: {
          daniel: new URL(DANIEL_DATA_URL, window.location.href).href,
          steve: new URL(STEVE_DATA_URL, window.location.href).href
        }
      })
      
      // Fetch real data
      try {
        const [danielResponse, steveResponse] = await Promise.all([
          fetch(DANIEL_DATA_URL),
          fetch(STEVE_DATA_URL)
        ])

        console.log('Fetch responses:', {
          daniel: { 
            ok: danielResponse.ok, 
            status: danielResponse.status,
            statusText: danielResponse.statusText,
          },
          steve: { 
            ok: steveResponse.ok, 
            status: steveResponse.status,
            statusText: steveResponse.statusText
          }
        })

        if (!danielResponse.ok) {
          throw new Error(`Failed to fetch Daniel data: ${danielResponse.status} ${danielResponse.statusText}`)
        }
        
        if (!steveResponse.ok) {
          throw new Error(`Failed to fetch Steve data: ${steveResponse.status} ${steveResponse.statusText}`)
        }

        let danielData = {}
        let steveData = {}
        
        // First get the raw text to debug JSON format
        try {
          const danielText = await danielResponse.text();
          console.log('Daniel JSON text:', danielText);
          
          try {
            danielData = JSON.parse(danielText);
            console.log('Daniel data parsed:', danielData);
          } catch (e) {
            console.error('Error parsing Daniel JSON:', e, 'Raw text was:', danielText);
            danielData = { generated: 0, consumed: 0, exported: 0, imported: 0, discharged: 0, maxPv: 0 };
          }
        } catch (e) {
          console.error('Error getting Daniel text:', e);
          danielData = { generated: 0, consumed: 0, exported: 0, imported: 0, discharged: 0, maxPv: 0 };
        }
        
        try {
          const steveText = await steveResponse.text();
          console.log('Steve JSON text:', steveText);
          
          try {
            steveData = JSON.parse(steveText);
            console.log('Steve data parsed:', steveData);
          } catch (e) {
            console.error('Error parsing Steve JSON:', e, 'Raw text was:', steveText);
            steveData = { generated: 0, consumed: 0, exported: 0, imported: 0, discharged: 0, maxPv: 0 };
          }
        } catch (e) {
          console.error('Error getting Steve text:', e);
          steveData = { generated: 0, consumed: 0, exported: 0, imported: 0, discharged: 0, maxPv: 0 };
        }

        data = {
          daniel: {
            generated: danielData.generated ?? 0,
            consumed: danielData.consumed ?? 0,
            soldBack: danielData.exported ?? 0,
            imported: danielData.imported ?? 0,
            discharged: danielData.discharged ?? 0,
            maxPv: danielData.maxPv ?? 0
          },
          steve: {
            generated: steveData.generated ?? 0,
            consumed: steveData.consumed ?? 0,
            soldBack: steveData.exported ?? 0,
            imported: steveData.imported ?? 0,
            discharged: steveData.discharged ?? 0,
            maxPv: steveData.maxPv ?? 0
          }
        }
      } catch (fetchError) {
        console.error('Network or parsing error:', fetchError)
        throw fetchError
      }
    }

    console.log('Final data to update:', data)
    updateStats(data)
    loadingIndicator.style.display = "none"
    statsContainer.style.opacity = "1"
  } catch (error) {
    console.error('Error in fetchAndUpdateData:', error)
    loadingIndicator.style.display = "none"
    errorMessage.style.display = "block"
    statsContainer.style.opacity = "0.5"
  }
}

// Update the statistics display
function updateStats(data) {
  if (!data || !data.daniel || !data.steve) {
    console.warn('Missing data for updateStats:', data)
    return
  }
  
  console.log('Updating stats with data:', data)
  
  // Calculate net scores
  const danielNet = calculateNetScore(data.daniel)
  const steveNet = calculateNetScore(data.steve)

  // Update display values with null checks
  if (danielGeneratedEl) danielGeneratedEl.textContent = `${data.daniel.generated.toFixed(1)} kWh`
  if (danielConsumedEl) danielConsumedEl.textContent = `${data.daniel.consumed.toFixed(1)} kWh`
  if (danielSoldEl) danielSoldEl.textContent = `${data.daniel.soldBack.toFixed(1)} kWh`
  if (danielNetEl) danielNetEl.textContent = `${danielNet.toFixed(1)} kWh`
  
  const danielImportedEl = document.getElementById("daniel-imported")
  if (danielImportedEl) danielImportedEl.textContent = `${data.daniel.imported.toFixed(1)} kWh`
  
  const danielDischargedEl = document.getElementById("daniel-discharged")
  if (danielDischargedEl) danielDischargedEl.textContent = `${data.daniel.discharged.toFixed(1)} kWh`
  
  const danielMaxpvEl = document.getElementById("daniel-maxpv")
  if (danielMaxpvEl) danielMaxpvEl.textContent = `${data.daniel.maxPv.toFixed(1)} kW`

  if (steveGeneratedEl) steveGeneratedEl.textContent = `${data.steve.generated.toFixed(1)} kWh`
  if (steveConsumedEl) steveConsumedEl.textContent = `${data.steve.consumed.toFixed(1)} kWh`
  if (steveSoldEl) steveSoldEl.textContent = `${data.steve.soldBack.toFixed(1)} kWh`
  if (steveNetEl) steveNetEl.textContent = `${steveNet.toFixed(1)} kWh`
  
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
  document.getElementById('solar-mvp').textContent = 
    data.daniel.generated > data.steve.generated ? 'Daniel' : 'Steve'
    
  // Grid Hustler
  document.getElementById('grid-hustler').textContent = 
    data.daniel.soldBack > data.steve.soldBack ? 'Daniel' : 'Steve'
    
  // Energy Vampire
  document.getElementById('energy-vampire').textContent = 
    data.daniel.consumed > data.steve.consumed ? 'Daniel' : 'Steve'
    
  // Battery Boss
  document.getElementById('battery-boss').textContent = 
    data.daniel.discharged > data.steve.discharged ? 'Daniel' : 'Steve'
    
  // Peak Performer
  document.getElementById('peak-performer').textContent = 
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
  danielImportedBadge.style.display = "none"
  steveImportedBadge.style.display = "none"
  danielDischargedBadge.style.display = "none"
  steveDischargedBadge.style.display = "none"
  danielMaxpvBadge.style.display = "none"
  steveMaxpvBadge.style.display = "none"

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
  // Discharged (lower is better)
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
  // Max PV (higher is better)
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

// Helper function to simulate network delay for mock data
function simulateNetworkDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Set today's date in the subtitle
  const today = new Date()
  const dateStr = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const dateEl = document.getElementById('today-date')
  if (dateEl) dateEl.textContent = dateStr
  
  // Start fetching data
  fetchAndUpdateData()
})

// Handle errors gracefully
window.addEventListener("error", (event) => {
  console.error("Application error:", event.error)
  errorMessage.style.display = "block"
  loadingIndicator.style.display = "none"
})

