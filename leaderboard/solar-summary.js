const fs = require('fs');
const https = require('https');
const path = require('path');
const { calculateHighScores } = require('./highscore-utils');

const urls = {
  daniel: 'https://raw.githubusercontent.com/danielraffel/solarshowdown-data/main/daniel.json',
  steve: 'https://raw.githubusercontent.com/danielraffel/solarshowdown-data/main/steve.json',
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function calculateNet({ generated, consumed, exported }) {
  return generated + exported - consumed;
}

function determineHighScores(danielData, steveData) {
  return {
    generatedMore: {
      winner: danielData.generated === steveData.generated ? 'Tied' :
              danielData.generated > steveData.generated ? 'Daniel' : 'Steve',
      value: Math.max(danielData.generated, steveData.generated),
      difference: Math.abs(danielData.generated - steveData.generated)
    },
    consumedLess: {
      winner: danielData.consumed === steveData.consumed ? 'Tied' :
              danielData.consumed < steveData.consumed ? 'Daniel' : 'Steve',
      value: Math.min(danielData.consumed, steveData.consumed),
      difference: Math.abs(danielData.consumed - steveData.consumed)
    },
    soldMore: {
      winner: danielData.exported === steveData.exported ? 'Tied' :
              danielData.exported > steveData.exported ? 'Daniel' : 'Steve',
      value: Math.max(danielData.exported, steveData.exported),
      difference: Math.abs(danielData.exported - steveData.exported)
    },
    importedLess: {
      winner: danielData.imported === steveData.imported ? 'Tied' :
              danielData.imported < steveData.imported ? 'Daniel' : 'Steve',
      value: Math.min(danielData.imported, steveData.imported),
      difference: Math.abs(danielData.imported - steveData.imported)
    },
    dischargedLess: {
      winner: danielData.discharged === steveData.discharged ? 'Tied' :
              danielData.discharged < steveData.discharged ? 'Daniel' : 'Steve',
      value: Math.min(danielData.discharged, steveData.discharged),
      difference: Math.abs(danielData.discharged - steveData.discharged)
    },
    highestMaxPv: {
      winner: danielData.maxPv === steveData.maxPv ? 'Tied' :
              danielData.maxPv > steveData.maxPv ? 'Daniel' : 'Steve',
      value: Math.max(danielData.maxPv, steveData.maxPv),
      difference: Math.abs(danielData.maxPv - steveData.maxPv)
    }
  };
}

async function main() {
  try {
    const [danielData, steveData] = await Promise.all([
      fetchJson(urls.daniel),
      fetchJson(urls.steve),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const danielNet = calculateNet(danielData);
    const steveNet = calculateNet(steveData);
    const winner = danielNet === steveNet ? 'Tie' : danielNet > steveNet ? 'Daniel' : 'Steve';
    const highScores = calculateHighScores(danielData, steveData);

    const dailyResult = {
      date: today,
      daniel: {
        ...danielData,
        net: danielNet,
      },
      steve: {
        ...steveData,
        net: steveNet,
      },
      winner,
      highScores,
      stats: {
        daniel: {
          generated: danielData.generated,
          consumed: danielData.consumed,
          exported: danielData.exported,
          imported: danielData.imported,
          discharged: danielData.discharged,
          maxPv: danielData.maxPv,
          net: danielNet
        },
        steve: {
          generated: steveData.generated,
          consumed: steveData.consumed,
          exported: steveData.exported,
          imported: steveData.imported,
          discharged: steveData.discharged,
          maxPv: steveData.maxPv,
          net: steveNet
        }
      }
    };

    const filePath = path.join(__dirname, 'daily-leaderboard.json');
    let leaderboard = [];

    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, 'utf8');
      leaderboard = JSON.parse(existing);
    }

    // Check if we already have an entry for today
    const todayIndex = leaderboard.findIndex(entry => entry.date === today);
    if (todayIndex !== -1) {
      leaderboard[todayIndex] = dailyResult;
    } else {
      leaderboard.push(dailyResult);
    }

    fs.writeFileSync(filePath, JSON.stringify(leaderboard, null, 2));
    console.log(`Saved Solar Showdown result for ${today}`);
  } catch (error) {
    console.error('Failed to fetch or save data:', error);
    process.exit(1);
  }
}

main();