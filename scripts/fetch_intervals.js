const fs = require('fs');
const path = require('path');
const { ATHLETE_ID, validateEnv, headers, formatDate } = require('./utils');

validateEnv();

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  
  if (!res.ok) {
    console.error(`API Error: ${res.status} ${res.statusText}`);
    console.error(`URL: ${url}`);
    console.error(`Response: ${text.substring(0, 500)}`);
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`JSON Parse Error for ${url}`);
    console.error(`Response: ${text.substring(0, 500)}`);
    throw e;
  }
}

async function main() {
  console.log("Starting Intervals.icu data sync...");
  console.log(`Athlete ID: ${ATHLETE_ID}`);

  const today = new Date();
  
  // 과거 42일, 미래 84일
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - 42);

  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 84);

  const pastStart = formatDate(pastDate);
  const todayStr = formatDate(today);
  const futureEnd = formatDate(futureDate);

  const urlProfile = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}`;
  const urlActivities = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}/activities?oldest=${pastStart}&newest=${todayStr}`;
  const urlWellness = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}/wellness?oldest=${pastStart}&newest=${todayStr}`;
  const urlEvents = `https://intervals.icu/api/v1/athlete/${ATHLETE_ID}/events?oldest=${pastStart}&newest=${futureEnd}`;

  const dirPath = path.join(__dirname, '../data');
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  // 기존 JSON 파일들 삭제 (.gitkeep 제외)
  const existingFiles = fs.readdirSync(dirPath);
  for (const file of existingFiles) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(dirPath, file));
      console.log(`Deleted: ${file}`);
    }
  }

  try {
    console.log("\nFetching profile...");
    const profile = await fetchJson(urlProfile);
    
    console.log("Fetching activities...");
    const activities = await fetchJson(urlActivities) || [];
    
    console.log("Fetching wellness...");
    const wellness = await fetchJson(urlWellness) || [];
    
    console.log("Fetching events...");
    const events = await fetchJson(urlEvents) || [];

    // 하나의 파일로 합쳐서 저장
    const combined = {
      profile,
      activities,
      wellness,
      events
    };

    const filePath = path.join(dirPath, 'intervals.json');
    const jsonStr = JSON.stringify(combined);
    fs.writeFileSync(filePath, jsonStr);
    
    const sizeKB = (jsonStr.length / 1024).toFixed(1);
    console.log(`\nSaved: intervals.json (${sizeKB}KB)`);
    console.log(`  - profile: 1 item`);
    console.log(`  - activities: ${activities.length} items`);
    console.log(`  - wellness: ${wellness.length} items`);
    console.log(`  - events: ${events.length} items`);

    console.log("\nSuccessfully synced all data!");

  } catch (error) {
    console.error("Failed to sync data:", error);
    process.exit(1);
  }
}

main();
