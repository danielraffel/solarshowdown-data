// Shared high score calculation for both frontend and backend
function calculateHighScores(daniel, steve) {
  return {
    generatedMore: {
      winner: daniel.generated === steve.generated ? 'Tied' : (daniel.generated > steve.generated ? 'Daniel' : 'Steve'),
      value: Math.max(daniel.generated, steve.generated)
    },
    consumedLess: {
      winner: daniel.consumed === steve.consumed ? 'Tied' : (daniel.consumed < steve.consumed ? 'Daniel' : 'Steve'),
      value: Math.min(daniel.consumed, steve.consumed)
    },
    soldMore: {
      winner: daniel.exported === steve.exported ? 'Tied' : (daniel.exported > steve.exported ? 'Daniel' : 'Steve'),
      value: Math.max(daniel.exported, steve.exported)
    },
    importedLess: {
      winner: daniel.imported === steve.imported ? 'Tied' : (daniel.imported < steve.imported ? 'Daniel' : 'Steve'),
      value: Math.min(daniel.imported, steve.imported)
    },
    dischargedLess: {
      winner: daniel.discharged === steve.discharged ? 'Tied' : (daniel.discharged < steve.discharged ? 'Daniel' : 'Steve'),
      value: Math.min(daniel.discharged, steve.discharged)
    },
    highestMaxPv: {
      winner: daniel.maxPv === steve.maxPv ? 'Tied' : (daniel.maxPv > steve.maxPv ? 'Daniel' : 'Steve'),
      value: Math.max(daniel.maxPv, steve.maxPv)
    }
  };
}

module.exports = { calculateHighScores }; 