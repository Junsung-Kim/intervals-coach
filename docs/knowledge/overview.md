# 종합: 부하 지표와 이 템플릿의 데이터

## JSON 응답 (`GET /data`)

Cloudflare Worker는 R2에 저장된 텍스트를 묶어 JSON으로 돌려준다.

| 필드 | 내용 |
|------|------|
| `summary` | 프로필, 스냅샷, 목표, 스케줄, 종목별 존·역치 (텍스트 섹션) |
| `wellness` | 일별 웰니스 CSV |
| `activities` | 활동 CSV (파워/HR 존 타임 등 포함) |
| `events` | 이벤트·계획 CSV |
| `prompt` | R2에 `prompt.txt`를 같이 올린 경우에만 별도 URL로 두는 패턴이 많음 (Worker는 기본적으로 위 네 필드만 서빙) |

### 필드 상세 (요약)

- **`summary`** (문자열): `[meta]`, `[snapshot]`, `[goals]`, `[schedule]`, `[cycling]`, `[running]`, `[swimming]` 등 섹션으로 프로필·스냅샷·목표·스케줄·종목별 존·역치.
- **`wellness`** (문자열, CSV): 일별 CTL/ATL/TSB 등. 예시 컬럼은 아래 wellness CSV 절 참고.
- **`activities`** (문자열, CSV): 활동 기록. 변환 스크립트 버전에 따르며, 예시로 `date`, `type`, `name`, `duration_mins`, `distance_km`, `load`, `intensity`, `avg_hr`, `max_hr`, `avg_power`, `np`, `elevation_m`, `cadence`, `est_ftp`, `est_wprime`, `pace_min_km`, `gap`, `rpe`, `feel`, `description`, `power_zone_times`, `hr_zone_times`, `trainer`, `calories` 등.
- **`events`** (문자열, CSV): 이벤트·계획. 예시로 `date`, `category`, `name`, `description`, `indoor`, `load_target`, `actual_load`, `duration_mins`, `distance_km`, `color` 등.

정확한 컬럼·순서는 [scripts/transform_data.js](../../scripts/transform_data.js)가 정의한다.

## CTL, ATL, TSB (wellness CSV)

- **CTL (Chronic Training Load)**: 만성 부하, “적응” 쪽에 가까운 누적 지표로 이해하면 된다.
- **ATL (Acute Training Load)**: 급성 부하, 최근 피로에 더 민감하다.
- **TSB (Training Stress Balance)**: 대략적으로 CTL과 ATL의 차이로 해석되는 **형태**의 균형 지표(Intervals 구현·라벨은 플랫폼 버전에 따름).

이 지표들은 **Banister·Impulse–Response** 계열 모델에서 널리 알려진 개념을 엔듀런스 대시보드에 맞게 쓴 것이다. 해석 프레임·철학적 기반은 [theories.md](theories.md) 참고.

## wellness CSV 컬럼 (예시)

`date`, `ctl`, `atl`, `tsb`, `ramp_rate`, `rhr`, `hrv`, `sleep_score`, `sleep_hours`, `weight`, `vo2max`, `comment` 등 — 변환 스크립트 버전에 맞게 [scripts/transform_data.js](../../scripts/transform_data.js)가 정의한다.

## 코칭 시 주의

- 수치는 **같은 사람 안에서의 추세**로 보는 것이 안전하다.
- “절대 정답”이 아니라 **훈련 로그와 함께 읽는 지표**다.
