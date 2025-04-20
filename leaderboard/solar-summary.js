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

async function main() {
  try {
    const [danielData, steveData] = await Promise.all([
      fetchJson(urls.daniel),
      fetchJson(urls.steve),
    ]);

    // Format date consistently (YYYY-MM-DD)
    const laDate = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const [month, day, year] = laDate.split(',')[0].split('/');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const danielNet = calculateNet(danielData);
    const steveNet = calculateNet(steveData);
    const winner = danielNet === steveNet ? 'Tie' : danielNet > steveNet ? 'Daniel' : 'Steve';
    const highScores = calculateHighScores(danielData, steveData);

    const dailyResult = {
      date: formattedDate,
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

    // Check using formatted date
    const existingIndex = leaderboard.findIndex(entry => entry.date === formattedDate);
    if (existingIndex !== -1) {
      leaderboard[existingIndex] = dailyResult;
    } else {
      leaderboard.push(dailyResult);
    }

    // Optional: sort by date ascending
    leaderboard.sort((a, b) => a.date.localeCompare(b.date));

    fs.writeFileSync(filePath, JSON.stringify(leaderboard, null, 2) + '\n');
    console.log(`✅ Saved Solar Showdown result for ${formattedDate}`);
  } catch (error) {
    console.error('❌ Failed to fetch or save data:', error);
    process.exit(1);
  }
}

main();

