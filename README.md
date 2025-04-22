# ☀️ Solar Showdown

A daily competition tracking solar energy production and consumption between Daniel and Steve! Who will be today's solar champion? [Announcement blog post](https://danielraffel.me/2025/04/16/solar-showdown-a-friendly-energy-face-off/).

## 🎮 What is Solar Showdown?

Solar Showdown is a friendly competition dashboard that pits two solar power systems against each other, tracking various energy metrics including:

- 🌟 Solar Energy Generated
- 🌱 Energy Consumed
- 💰 Energy Sold to Grid
- 🔌 Energy Imported from Grid
- 🪫 Battery Discharged
- ⚡ Max PV from Solar Array

Each day, a new champion is crowned based on who harvests the most solar energy and uses it most efficiently!

## 🏗️ Project Structure

- **Frontend**: Vanilla JavaScript and CSS for a clean, responsive dashboard
- **Backend**: Uses [solarshowdown-api](https://github.com/skrul/solarshowdown-api) to fetch metrics from InfluxDB
- **Data**: Daily JSON files tracking solar performance metrics and a leaderboard section summarizing top performers
- **Scripts**: `update-daily-leaderboard.sh` script generates/upgrades the leaderboard data

## 🌟 Features

- Real-time solar performance tracking
- Daily champion crowning
- Multiple performance categories
- Social media preview cards
- Responsive design
- Emoji indicators for achievements
- Day / Night mode
- Leaderboard section highlighting daily and all-time top performers

## 🏆 Bonus Categories

- ☀️ Solar MVP - Highest energy generation
- ⚡ Grid Hustler - Most energy sold back to grid
- 🧛 Energy Vampire - Highest consumption
- 🔋 Battery Boss - Best battery utilization
- ⚡ Peak Performer - Highest peak power
- 👑 Net Champion - Best overall performance

## 🔧 Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- [solarshowdown-api](https://github.com/skrul/solarshowdown-api) for data fetching
- InfluxDB and Grafana for metrics storage
- GitHub pages for hosting

## 📊 Data Updates

The dashboard updates automatically throughout the day, pulling fresh data from the solar systems. There are two scheduled scripts that keep everything current:

- **Hourly Data Update (Daniel)**  
A cron job runs [update-data-daniel.sh](update-data-daniel.sh) every hour to fetch the latest solar stats and update [daniel.json](daniel.json) if anything has changed.

**Sample cron job:**

```
00 * * * * /opt/solarshowdown-data/update-data-daniel.sh >> /opt/solarshowdown-data/update.log 2>&1
```

- **Hourly Data Update (Steve)**  
Steve runs a similar script from his machine, pushing updated data roughly one minute after Daniel’s, ensuring both sources are refreshed in near real-time.

- **Nightly Leaderboard Update**  
Another cron job runs [update-daily-leaderboard.sh](update-daily-leaderboard.sh) at 11:55 PM to regenerate the [daily-leaderboard.json](leaderboard/daily-leaderboard.json), which summarizes the day’s performance and crowns the daily champion.

Behind the scenes, this script invokes [`solar-summary.js`](leaderboard/solar-summary.js), which fetches both users’ solar data, calculates each person’s net energy (generated + exported − consumed), determines the winner, and evaluates bonus categories (like highest generation, lowest import, etc.). If the day's result already exists in the leaderboard, it updates it; otherwise, it appends a new entry and keeps the leaderboard sorted chronologically.

**Sample cron job:**
```
55 23 * * * /opt/solarshowdown-data/update-daily-leaderboard.sh >> /opt/solarshowdown-data/update-leaderboard.log 2>&1
```

## 🎨 Preview

Visit [Solar Showdown](https://danielraffel.github.io/solarshowdown-data/) to see who's winning today!

## 📜 License

MIT License - Feel free to create your own solar showdown! 
