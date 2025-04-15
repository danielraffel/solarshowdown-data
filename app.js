// Solar Showdown - Main Application Logic

// Configuration
const DANIEL_DATA_URL = "https://raw.githubusercontent.com/danielraffel/solarshowdown-data/refs/heads/main/daniel.json"
const STEVE_DATA_URL = "https://raw.githubusercontent.com/danielraffel/solarshowdown-data/refs/heads/main/steve.json"
// Use a CORS proxy to avoid cross-origin issues
const CORS_PROXY = "https://corsproxy.io/?" // Alternative: "https://cors-anywhere.herokuapp.com/"
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
const danielRoastEl = document.getElementById("daniel-roast")
const danielGeneratedBadge = document.getElementById("daniel-generated-badge")
const danielConsumedBadge = document.getElementById("daniel-consumed-badge")
const danielSoldBadge = document.getElementById("daniel-sold-badge")

// Steve elements
const steveGeneratedEl = document.getElementById("steve-generated")
const steveConsumedEl = document.getElementById("steve-consumed")
const steveSoldEl = document.getElementById("steve-sold")
const steveNetEl = document.getElementById("steve-net")
const steveWinnerBadge = document.getElementById("steve-winner")
const steveRoastEl = document.getElementById("steve-roast")
const steveGeneratedBadge = document.getElementById("steve-generated-badge")
const steveConsumedBadge = document.getElementById("steve-consumed-badge")
const steveSoldBadge = document.getElementById("steve-sold-badge")

// EV elements
const danielEvMilesEl = document.getElementById("daniel-ev-miles")
const danielEvEnergyEl = document.getElementById("daniel-ev-energy")
const danielEvSolarPercentEl = document.getElementById("daniel-ev-solar-percent")
const danielEvEfficiencyEl = document.getElementById("daniel-ev-efficiency")
const danielEvBadgeEl = document.getElementById("daniel-ev-badge")

const steveEvMilesEl = document.getElementById("steve-ev-miles")
const steveEvEnergyEl = document.getElementById("steve-ev-energy")
const steveEvSolarPercentEl = document.getElementById("steve-ev-solar-percent")
const steveEvEfficiencyEl = document.getElementById("steve-ev-efficiency")
const steveEvBadgeEl = document.getElementById("steve-ev-badge")

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
    },
    steve: {
      generated: 19.5,
      consumed: 16.7,
      soldBack: 5.2,
    },
  },
  weekly: {
    daniel: {
      generated: 142.5,
      consumed: 98.3,
      soldBack: 52.7,
    },
    steve: {
      generated: 156.2,
      consumed: 112.8,
      soldBack: 48.9,
    },
  },
  monthly: {
    daniel: {
      generated: 587.3,
      consumed: 412.6,
      soldBack: 201.4,
    },
    steve: {
      generated: 602.8,
      consumed: 435.1,
      soldBack: 189.7,
    },
  },
  yearly: {
    daniel: {
      generated: 6842.5,
      consumed: 4987.2,
      soldBack: 2314.8,
    },
    steve: {
      generated: 7105.3,
      consumed: 5243.9,
      soldBack: 2198.6,
    },
  },
}

// EV charging data
const evMockData = {
  daily: {
    daniel: {
      milesAdded: 42,
      totalEnergy: 12.5,
      solarPercentage: 78,
    },
    steve: {
      milesAdded: 38,
      totalEnergy: 10.2,
      solarPercentage: 85,
    },
  },
  weekly: {
    daniel: {
      milesAdded: 215,
      totalEnergy: 64.8,
      solarPercentage: 72,
    },
    steve: {
      milesAdded: 198,
      totalEnergy: 58.3,
      solarPercentage: 68,
    },
  },
  monthly: {
    daniel: {
      milesAdded: 920,
      totalEnergy: 276.5,
      solarPercentage: 65,
    },
    steve: {
      milesAdded: 875,
      totalEnergy: 245.8,
      solarPercentage: 70,
    },
  },
  yearly: {
    daniel: {
      milesAdded: 11250,
      totalEnergy: 3375.2,
      solarPercentage: 62,
    },
    steve: {
      milesAdded: 10850,
      totalEnergy: 3042.6,
      solarPercentage: 68,
    },
  },
}

// Roast messages
const roastMessages = {
  highConsumption: [
    "Are you mining Bitcoin in your basement?",
    "Did you leave every light on in the house?",
    "Your electricity meter is spinning like a DJ.",
    "Your power bill must look like a phone number.",
    "Do you own stock in the power company?",
    "Your house glows so bright, astronauts can see it from space.",
  ],
  lowGeneration: [
    "Did you install your panels in a cave?",
    "Your panels need a pep talk.",
    "Have you tried cleaning those panels... ever?",
    "Your solar panels are on vacation.",
    "Are your solar panels playing hide and seek with the sun?",
    "Your panels generate about as much energy as a potato clock.",
  ],
  highGeneration: [
    "Your panels are working overtime!",
    "Did you install extra panels when no one was looking?",
    "Your roof is basically a mini power plant.",
    "Those panels are showing off!",
    "Did you steal the sun and put it on your roof?",
    "Your panels are so efficient they might start powering the neighbors too.",
  ],
  lowConsumption: [
    "Do you even use electricity?",
    "Living that candlelight lifestyle, huh?",
    "Your appliances must be on strike.",
    "Are you actually living in your house?",
    "Do you cook with a magnifying glass?",
    "Your power consumption is lower than a hibernating bear's heart rate.",
  ],
}

// Initialize the application
function init() {
  // No event listeners for timeframe or roast mode
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
      await simulateNetworkDelay(500)
      data = mockData[timeframe]
    } else {
      data = mockData[timeframe] // fallback for non-daily
      // Fetch real data from GitHub
      const danielResponse = await fetch(DANIEL_DATA_URL)
      const steveResponse = await fetch(STEVE_DATA_URL)
      if (danielResponse.ok && steveResponse.ok) {
        let danielData = {}
        let steveData = {}
        try {
          danielData = await danielResponse.json()
        } catch (e) {
          danielData = { generated: 0, consumed: 0, exported: 0, imported: 0, discharged: 0, maxPv: 0 }
        }
        try {
          steveData = await steveResponse.json()
        } catch (e) {
          steveData = { generated: 0, consumed: 0, exported: 0, imported: 0, discharged: 0, maxPv: 0 }
        }
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
      }
    }

    updateStats(data)
    loadingIndicator.style.display = "none"
    statsContainer.style.opacity = "1"
    updateRoastMessages(data)
  } catch (error) {
    loadingIndicator.style.display = "none"
    errorMessage.style.display = "block"
    statsContainer.style.opacity = "0.5"
  }
}

// Update the statistics display
function updateStats(data) {
  // Calculate net scores
  const danielNet = calculateNetScore(data.daniel)
  const steveNet = calculateNetScore(data.steve)

  // Update display values
  danielGeneratedEl.textContent = `${data.daniel.generated.toFixed(1)} kWh`
  danielConsumedEl.textContent = `${data.daniel.consumed.toFixed(1)} kWh`
  danielSoldEl.textContent = `${data.daniel.soldBack.toFixed(1)} kWh`
  danielNetEl.textContent = `${danielNet.toFixed(1)} kWh`
  document.getElementById("daniel-imported").textContent = `${data.daniel.imported.toFixed(1)} kWh`
  document.getElementById("daniel-discharged").textContent = `${data.daniel.discharged.toFixed(1)} kWh`
  document.getElementById("daniel-maxpv").textContent = `${data.daniel.maxPv.toFixed(1)} kW`

  steveGeneratedEl.textContent = `${data.steve.generated.toFixed(1)} kWh`
  steveConsumedEl.textContent = `${data.steve.consumed.toFixed(1)} kWh`
  steveSoldEl.textContent = `${data.steve.soldBack.toFixed(1)} kWh`
  steveNetEl.textContent = `${steveNet.toFixed(1)} kWh`
  document.getElementById("steve-imported").textContent = `${data.steve.imported.toFixed(1)} kWh`
  document.getElementById("steve-discharged").textContent = `${data.steve.discharged.toFixed(1)} kWh`
  document.getElementById("steve-maxpv").textContent = `${data.steve.maxPv.toFixed(1)} kW`

  // Determine winner
  determineWinner(danielNet, steveNet)

  // Update bonus categories
  updateBonusCategories(data)

  // Update roast messages if enabled
  if (roastModeToggle.checked) {
    updateRoastMessages(data)
  }

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
    data.daniel.generated > data.steve.generated ? 'Daniel' : 'Steve';
    
  // Grid Hustler
  document.getElementById('grid-hustler').textContent = 
    data.daniel.soldBack > data.steve.soldBack ? 'Daniel' : 'Steve';
    
  // Energy Vampire
  document.getElementById('energy-vampire').textContent = 
    data.daniel.consumed > data.steve.consumed ? 'Daniel' : 'Steve';
    
  // Battery Boss
  document.getElementById('battery-boss').textContent = 
    data.daniel.discharged > data.steve.discharged ? 'Daniel' : 'Steve';
    
  // Peak Performer
  document.getElementById('peak-performer').textContent = 
    data.daniel.maxPv > data.steve.maxPv ? 'Daniel' : 'Steve';
}

// Update roast messages: always show
function updateRoastMessages(data) {
  danielRoastEl.textContent = ""
  steveRoastEl.textContent = ""
  danielRoastEl.style.display = "block"
  steveRoastEl.style.display = "block"
  if (!data) return
  if (data.daniel && data.steve) {
    let danielRoasted = false
    if (data.daniel.consumed > data.steve.consumed * 1.2) {
      danielRoastEl.textContent = getRandomRoast("highConsumption")
      danielRoasted = true
    } else if (data.daniel.generated < data.steve.generated * 0.8) {
      danielRoastEl.textContent = getRandomRoast("lowGeneration")
      danielRoasted = true
    } else if (data.daniel.generated > data.steve.generated * 1.2) {
      danielRoastEl.textContent = getRandomRoast("highGeneration")
      danielRoasted = true
    } else if (data.daniel.consumed < data.steve.consumed * 0.8) {
      danielRoastEl.textContent = getRandomRoast("lowConsumption")
      danielRoasted = true
    }
    if (!danielRoasted) {
      danielRoastEl.textContent = "Your energy usage is so average, it's boring."
    }
    let steveRoasted = false
    if (data.steve.consumed > data.daniel.consumed * 1.2) {
      steveRoastEl.textContent = getRandomRoast("highConsumption")
      steveRoasted = true
    } else if (data.steve.generated < data.daniel.generated * 0.8) {
      steveRoastEl.textContent = getRandomRoast("lowGeneration")
      steveRoasted = true
    } else if (data.steve.generated > data.daniel.generated * 1.2) {
      steveRoastEl.textContent = getRandomRoast("highGeneration")
      steveRoasted = true
    } else if (data.steve.consumed < data.daniel.consumed * 0.8) {
      steveRoastEl.textContent = getRandomRoast("lowConsumption")
      steveRoasted = true
    }
    if (!steveRoasted) {
      steveRoastEl.textContent = "Steve's energy stats are as exciting as watching paint dry."
    }
  }
}

// Get a random roast message from the category
function getRandomRoast(category) {
  const messages = roastMessages[category]
  const randomIndex = Math.floor(Math.random() * messages.length)
  return messages[randomIndex]
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

  // Set badges based on who has better stats
  if (data.daniel.generated > data.steve.generated) {
    danielGeneratedBadge.textContent = "🌟"
    danielGeneratedBadge.style.display = "block"
  } else if (data.steve.generated > data.daniel.generated) {
    steveGeneratedBadge.textContent = "🌟"
    steveGeneratedBadge.style.display = "block"
  }

  if (data.daniel.soldBack > data.steve.soldBack) {
    danielSoldBadge.textContent = "💰"
    danielSoldBadge.style.display = "block"
  } else if (data.steve.soldBack > data.daniel.soldBack) {
    steveSoldBadge.textContent = "💰"
    steveSoldBadge.style.display = "block"
  }

  if (data.daniel.consumed < data.steve.consumed) {
    danielConsumedBadge.textContent = "🌱"
    danielConsumedBadge.style.display = "block"
  } else if (data.steve.consumed < data.daniel.consumed) {
    steveConsumedBadge.textContent = "🌱"
    steveConsumedBadge.style.display = "block"
  }
}

// Helper function to simulate network delay for mock data
function simulateNetworkDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Set today's date in the subtitle
  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const dateEl = document.getElementById('today-date');
  if (dateEl) dateEl.textContent = dateStr;
  init();
});

// Handle errors gracefully
window.addEventListener("error", (event) => {
  console.error("Application error:", event.error)
  errorMessage.style.display = "block"
  loadingIndicator.style.display = "none"
})

