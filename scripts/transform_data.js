const fs = require('fs');
const path = require('path');

// ========== 유틸리티 함수 ==========

/**
 * 마지막 유효값 찾기
 */
function getLastKnown(array, field, dateField = 'id') {
  if (!array || !array.length) return null;
  
  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i][field] != null) {
      return { value: array[i][field], date: array[i][dateField] };
    }
  }
  return null;
}

/**
 * CSV 이스케이프 처리
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * 배열을 CSV 문자열로 변환
 */
function toCSV(array, columns) {
  if (!array || !array.length) return '';
  
  const header = columns.map(c => c.header || c.key).join(',');
  const rows = array.map(item => 
    columns.map(c => escapeCSV(c.transform ? c.transform(item) : item[c.key])).join(',')
  );
  
  return header + '\n' + rows.join('\n');
}

// ========== Profile 추출 ==========

function formatPace(mps) {
  if (!mps) return null;
  const secPerKm = 1000 / mps;
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60);
  return mins + ':' + secs.toString().padStart(2, '0') + '/km';
}

function extractProfile(profile) {
  if (!profile || !profile.sportSettings) return { cycling: null, running: null, swimming: null };
  
  const cycling = profile.sportSettings.find(s => s.types?.includes('Ride'));
  const running = profile.sportSettings.find(s => s.types?.includes('Run'));
  const swimming = profile.sportSettings.find(s => s.types?.includes('Swim'));
  
  return {
    cycling: cycling ? {
      ftp: cycling.ftp,
      indoor_ftp: cycling.indoor_ftp,
      lthr: cycling.lthr,
      max_hr: cycling.max_hr,
      power_zones: cycling.power_zones,
      power_zone_names: cycling.power_zone_names,
      hr_zones: cycling.hr_zones,
      hr_zone_names: cycling.hr_zone_names
    } : null,
    running: running ? {
      threshold_pace: running.threshold_pace,
      threshold_pace_formatted: formatPace(running.threshold_pace),
      lthr: running.lthr,
      max_hr: running.max_hr,
      pace_zones: running.pace_zones,
      pace_zone_names: running.pace_zone_names,
      hr_zones: running.hr_zones,
      hr_zone_names: running.hr_zone_names
    } : null,
    swimming: swimming ? {
      css: swimming.threshold_pace,
      css_formatted: formatPace(swimming.threshold_pace),
      lthr: swimming.lthr,
      max_hr: swimming.max_hr,
      hr_zones: swimming.hr_zones,
      hr_zone_names: swimming.hr_zone_names,
      pace_zones: swimming.pace_zones,
      pace_zone_names: swimming.pace_zone_names
    } : null
  };
}

/**
 * summary 객체를 플랫 텍스트(key: value) 형식으로 변환
 */
function buildSummaryText(summary) {
  const lines = [];

  // [meta]
  const m = summary.meta;
  lines.push('[meta]');
  lines.push(`generated: ${m.generated_at}`);
  lines.push(`data_range: ${m.data_range.start} ~ ${m.data_range.end} (${m.data_range.days} days)`);
  lines.push(`wellness_days: ${m.counts.wellness_days}`);
  lines.push(`activities: ${m.counts.activities}`);
  lines.push(`events_past: ${m.counts.events_past}`);
  lines.push(`events_upcoming: ${m.counts.events_upcoming}`);

  // [snapshot]
  const s = summary.snapshot;
  lines.push('');
  lines.push('[snapshot]');
  lines.push(`date: ${s.date}`);
  lines.push(`ctl: ${s.ctl}`);
  lines.push(`atl: ${s.atl}`);
  lines.push(`tsb: ${s.tsb}`);
  lines.push(`ramp_rate: ${s.ramp_rate}`);
  lines.push(`rhr: ${s.rhr}`);
  lines.push(`hrv: ${s.hrv}`);
  lines.push(`sleep_score: ${s.sleep_score}`);
  lines.push(`sleep_hours: ${s.sleep_hours}`);
  const w = s.latest_weight;
  lines.push(`weight: ${w ? `${w.value} (${w.date})` : '-'}`);
  const v = s.latest_vo2max;
  lines.push(`vo2max: ${v ? `${v.value} (${v.date})` : '-'}`);

  // [goals]
  const g = summary.goals;
  lines.push('');
  lines.push('[goals]');
  lines.push(`weight_kg: ${g.weight_kg}`);
  lines.push(`ftp_wpkg: ${g.ftp_wpkg}`);
  lines.push(`run_10k_mins: ${g.run_10k_mins}`);
  lines.push(`swim_1500m_mins: ${g.swim_1500m_mins}`);
  lines.push(`long_term: ${g.long_term}`);

  // [schedule]
  const sc = summary.schedule;
  lines.push('');
  lines.push('[schedule]');
  lines.push(`swimming: ${sc.swimming}`);
  lines.push(`running: ${sc.running}`);

  // [cycling]
  const c = summary.profile.cycling;
  if (c) {
    lines.push('');
    lines.push('[cycling]');
    lines.push(`ftp: ${c.ftp}`);
    lines.push(`indoor_ftp: ${c.indoor_ftp}`);
    lines.push(`lthr: ${c.lthr}`);
    lines.push(`max_hr: ${c.max_hr}`);
    if (c.power_zones) lines.push(`power_zones: ${c.power_zones.join('|')}`);
    if (c.power_zone_names) lines.push(`power_zone_names: ${c.power_zone_names.join('|')}`);
    if (c.hr_zones) lines.push(`hr_zones: ${c.hr_zones.join('|')}`);
    if (c.hr_zone_names) lines.push(`hr_zone_names: ${c.hr_zone_names.join('|')}`);
  }

  // [running]
  const r = summary.profile.running;
  if (r) {
    lines.push('');
    lines.push('[running]');
    lines.push(`threshold_pace: ${r.threshold_pace_formatted || r.threshold_pace}`);
    lines.push(`lthr: ${r.lthr}`);
    lines.push(`max_hr: ${r.max_hr}`);
    if (r.pace_zones) lines.push(`pace_zones: ${r.pace_zones.join('|')}`);
    if (r.pace_zone_names) lines.push(`pace_zone_names: ${r.pace_zone_names.join('|')}`);
    if (r.hr_zones) lines.push(`hr_zones: ${r.hr_zones.join('|')}`);
    if (r.hr_zone_names) lines.push(`hr_zone_names: ${r.hr_zone_names.join('|')}`);
  }

  // [swimming] - 설정이 있을 때만 출력
  const sw = summary.profile.swimming;
  if (sw) {
    lines.push('');
    lines.push('[swimming]');
    if (sw.css_formatted) lines.push(`css: ${sw.css_formatted}`);
    if (sw.lthr) lines.push(`lthr: ${sw.lthr}`);
    if (sw.max_hr) lines.push(`max_hr: ${sw.max_hr}`);
    if (sw.hr_zones) lines.push(`hr_zones: ${sw.hr_zones.join('|')}`);
    if (sw.hr_zone_names) lines.push(`hr_zone_names: ${sw.hr_zone_names.join('|')}`);
    if (sw.pace_zones) lines.push(`pace_zones: ${sw.pace_zones.join('|')}`);
    if (sw.pace_zone_names) lines.push(`pace_zone_names: ${sw.pace_zone_names.join('|')}`);
  }

  return lines.join('\n') + '\n';
}

// ========== CSV 컬럼 정의 ==========

const WELLNESS_COLUMNS = [
  { key: 'id', header: 'date' },
  { key: 'ctl', header: 'ctl' },
  { key: 'atl', header: 'atl' },
  { key: 'tsb', header: 'tsb', transform: w => w.ctl != null && w.atl != null ? Math.round((w.ctl - w.atl) * 100) / 100 : '' },
  { key: 'rampRate', header: 'ramp_rate' },
  { key: 'restingHR', header: 'rhr' },
  { key: 'hrv', header: 'hrv' },
  { key: 'sleepScore', header: 'sleep_score' },
  { key: 'sleepSecs', header: 'sleep_hours', transform: w => w.sleepSecs ? Math.round(w.sleepSecs / 360) / 10 : '' },
  { key: 'weight', header: 'weight' },
  { key: 'vo2max', header: 'vo2max' },
  { key: 'comments', header: 'comment' }
];

const ACTIVITY_COLUMNS = [
  { key: 'start_date_local', header: 'date', transform: a => a.start_date_local?.slice(0, 10) },
  { key: 'type', header: 'type' },
  { key: 'name', header: 'name' },
  { key: 'moving_time', header: 'duration_mins', transform: a => {
    const time = (a.type === 'Swim') ? (a.elapsed_time || a.moving_time) : a.moving_time;
    return time ? Math.round(time / 60) : '';
  }},
  { key: 'distance', header: 'distance_km', transform: a => a.distance ? Math.round(a.distance / 100) / 10 : '' },
  { key: 'icu_training_load', header: 'load' },
  { key: 'icu_intensity', header: 'intensity', transform: a => a.icu_intensity ? Math.round(a.icu_intensity * 100) / 100 : '' },
  { key: 'average_heartrate', header: 'avg_hr' },
  { key: 'max_heartrate', header: 'max_hr' },
  { key: 'icu_average_watts', header: 'avg_power' },
  { key: 'weighted_avg_watts', header: 'np' },
  { key: 'total_elevation_gain', header: 'elevation_m' },
  { key: 'average_cadence', header: 'cadence' },
  { key: 'icu_pm_cp', header: 'est_ftp' },
  { key: 'icu_pm_w_prime', header: 'est_wprime' },
  // pace는 m/s 단위 → 분/km로 변환
  { key: 'pace', header: 'pace_min_km', transform: a => {
    if (!a.pace) return '';
    const minPerKm = 1000 / a.pace / 60;
    return Math.round(minPerKm * 100) / 100;
  }},
  { key: 'gap', header: 'gap' },
  { key: 'icu_rpe', header: 'rpe' },
  { key: 'feel', header: 'feel' },
  { key: 'description', header: 'description' },
  { key: 'icu_zone_times', header: 'power_zone_times',
    transform: a => a.icu_zone_times ? a.icu_zone_times.map(t => {
      const secs = typeof t === 'object' ? t.secs : t;
      return isFinite(secs) ? Math.round(secs / 60) : 0;
    }).join('|') : '' },
  { key: 'icu_hr_zone_times', header: 'hr_zone_times',
    transform: a => a.icu_hr_zone_times ? a.icu_hr_zone_times.map(t => isFinite(t) ? Math.round(t / 60) : 0).join('|') : '' },
  { key: 'trainer', header: 'trainer', transform: a => a.trainer ? 'Y' : '' },
  { key: 'calories', header: 'calories' }
];

const EVENT_COLUMNS = [
  { key: 'start_date_local', header: 'date', transform: e => e.start_date_local?.slice(0, 10) },
  { key: 'category', header: 'category' },
  { key: 'name', header: 'name' },
  { key: 'description', header: 'description' },
  { key: 'indoor', header: 'indoor', transform: e => e.indoor ? 'Y' : '' },
  { key: 'load_target', header: 'load_target' },
  { key: 'icu_training_load', header: 'actual_load' },
  { key: 'moving_time', header: 'duration_mins', transform: e => e.moving_time ? Math.round(e.moving_time / 60) : '' },
  { key: 'distance', header: 'distance_km', transform: e => e.distance ? Math.round(e.distance / 100) / 10 : '' },
  { key: 'color', header: 'color' }
];

// ========== 메인 변환 함수 ==========

function transformData(data) {
  // intervals.json 구조: { profile, activities, wellness, events }
  const { profile, activities = [], wellness = [], events = [] } = data;
  
  // 1. wellness 정렬
  const sortedWellness = [...wellness].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
  
  // 2. activities 정렬
  const sortedActivities = [...activities].sort((a, b) => 
    (a.start_date_local || '').localeCompare(b.start_date_local || '')
  );
  
  // 3. events 정렬 및 분류
  const sortedEvents = [...events].sort((a, b) => 
    (a.start_date_local || '').localeCompare(b.start_date_local || '')
  );
  
  const today = new Date().toISOString().slice(0, 10);
  const eventsPast = sortedEvents.filter(e => (e.start_date_local?.slice(0, 10) || '') < today);
  const eventsUpcoming = sortedEvents.filter(e => (e.start_date_local?.slice(0, 10) || '') >= today);
  
  // 4. 최신 상태
  const latest = sortedWellness[sortedWellness.length - 1];
  
  // 5. CSV 생성
  const wellnessCSV = toCSV(sortedWellness, WELLNESS_COLUMNS);
  const activitiesCSV = toCSV(sortedActivities, ACTIVITY_COLUMNS);
  const eventsCSV = toCSV(sortedEvents, EVENT_COLUMNS);
  
  // 6. Summary JSON
  const summary = {
    meta: {
      generated_at: new Date().toISOString(),
      data_range: {
        start: sortedWellness[0]?.id,
        end: sortedWellness[sortedWellness.length - 1]?.id,
        days: sortedWellness.length
      },
      counts: {
        wellness_days: sortedWellness.length,
        activities: sortedActivities.length,
        events_past: eventsPast.length,
        events_upcoming: eventsUpcoming.length
      }
    },
    
    snapshot: {
      date: latest?.id,
      ctl: latest?.ctl,
      atl: latest?.atl,
      tsb: latest?.ctl != null && latest?.atl != null ? Math.round((latest.ctl - latest.atl) * 100) / 100 : null,
      ramp_rate: latest?.rampRate,
      rhr: latest?.restingHR,
      hrv: latest?.hrv,
      sleep_score: latest?.sleepScore,
      sleep_hours: latest?.sleepSecs ? Math.round(latest.sleepSecs / 360) / 10 : null,
      latest_weight: getLastKnown(sortedWellness, 'weight'),
      latest_vo2max: getLastKnown(sortedWellness, 'vo2max'),
      comment: latest?.comments || null
    },
    
    // ▼ 본인 목표에 맞게 수정하세요 ──────────────────────────────────────────
    goals: {
      weight_kg: null,           // 예: 70
      ftp_wpkg: null,            // 예: 3.5  (W/kg)
      run_10k_mins: null,        // 예: 50   (분)
      swim_1500m_mins: null,     // 예: 35   (분)
      long_term: 'YOUR_GOAL'    // 예: 'triathlon_olympic'
    },

    schedule: {
      swimming: 'YOUR_SWIM_SCHEDULE',  // 예: '화,목 주 2회'
      running: 'YOUR_RUN_SCHEDULE'     // 예: '주 3회'
    },
    // ────────────────────────────────────────────────────────────────────────
    
    profile: extractProfile(profile)
  };
  
  return { wellnessCSV, activitiesCSV, eventsCSV, summary };
}

// ========== 실행 ==========

function main() {
  const inputPath = path.join(__dirname, '../data/intervals.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error('Error: intervals.json not found');
    process.exit(1);
  }
  
  console.log('Reading:', inputPath);
  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  const originalSize = JSON.stringify(rawData).length;
  console.log('Original size:', (originalSize / 1024).toFixed(1), 'KB');
  
  console.log('\nTransforming to CSV + TXT...');
  const { wellnessCSV, activitiesCSV, eventsCSV, summary } = transformData(rawData);
  
  const summaryText = buildSummaryText(summary);
  
  // 파일 저장
  const dataDir = path.join(__dirname, '../data');
  
  fs.writeFileSync(path.join(dataDir, 'wellness.txt'), wellnessCSV);
  fs.writeFileSync(path.join(dataDir, 'activities.txt'), activitiesCSV);
  fs.writeFileSync(path.join(dataDir, 'events.txt'), eventsCSV);
  fs.writeFileSync(path.join(dataDir, 'summary.txt'), summaryText);
  
  // 크기 출력
  const wellnessSize = wellnessCSV.length;
  const activitiesSize = activitiesCSV.length;
  const eventsSize = eventsCSV.length;
  const summarySize = summaryText.length;
  const totalSize = wellnessSize + activitiesSize + eventsSize + summarySize;
  
  console.log('\n=== Output Files ===');
  console.log(`wellness.txt:   ${(wellnessSize / 1024).toFixed(1)} KB`);
  console.log(`activities.txt: ${(activitiesSize / 1024).toFixed(1)} KB`);
  console.log(`events.txt:     ${(eventsSize / 1024).toFixed(1)} KB`);
  console.log(`summary.txt:    ${(summarySize / 1024).toFixed(1)} KB`);
  console.log(`---`);
  console.log(`Total:          ${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`Reduction:      ${Math.round((originalSize - totalSize) / originalSize * 100)}%`);
  
  console.log('\n=== summary.txt ===');
  console.log(summaryText);
}

main();
