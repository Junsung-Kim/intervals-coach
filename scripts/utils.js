const API_KEY = process.env.INTERVALS_API_KEY;
const ATHLETE_ID = process.env.INTERVALS_ATHLETE_ID;

function validateEnv() {
  if (!API_KEY || !ATHLETE_ID) {
    console.error("Error: API_KEY or ATHLETE_ID is missing.");
    process.exit(1);
  }
}

const authHeader = API_KEY 
  ? "Basic " + Buffer.from("API_KEY:" + API_KEY).toString('base64')
  : null;

const headers = {
  "Authorization": authHeader,
  "Content-Type": "application/json"
};

// 한국 시간(KST, UTC+9) 기준으로 날짜 포맷
const formatDate = (date) => {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  API_KEY,
  ATHLETE_ID,
  validateEnv,
  authHeader,
  headers,
  formatDate,
  sleep
};

