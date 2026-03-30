# 시스템 워크플로 (다이어그램)

텍스트로 길게 설명하기보다 흐름을 그림으로 먼저 잡는다. GitHub에서 Mermaid가 렌더링된다.

## 1. 데이터 파이프라인 (Intervals → R2 → Worker)

```mermaid
flowchart LR
  intervals[Intervals.icu_API]
  gha[GitHub_Actions]
  scripts[fetch_transform]
  r2[Cloudflare_R2]
  worker[Cloudflare_Worker]
  llm[Claude_ChatGPT_등]

  intervals -->|API_key| gha
  gha --> scripts
  scripts -->|summary_wellness_activities_events_prompt| r2
  r2 -->|R2_binding| worker
  worker -->|GET_/data_JSON| llm
```

## 2. Fork 이후 첫 설정 순서

```mermaid
flowchart TD
  fork[upstream_repo_Fork]
  clone[로컬_clone]
  secrets[GitHub_Secrets_등록]
  r2cf[Cloudflare_R2_버킷_API_키]
  wr[wrangler.toml_버킷명_수정]
  deploy[wrangler_deploy]
  act[Actions_수동_실행_cron은_옵트인]

  fork --> clone
  clone --> secrets
  secrets --> r2cf
  r2cf --> wr
  wr --> deploy
  deploy --> act
```

**주의:** GitHub Secrets는 **본인 fork 저장소**에 넣는다. upstream 템플릿 repo에는 비밀을 커밋하지 않는다.

## 3. GitHub Actions 한 번의 실행 안에서

```mermaid
sequenceDiagram
  participant G as GitHub_Actions
  participant I as Intervals.icu
  participant D as data_txt
  participant R2 as R2_bucket

  G->>I: fetch_intervals.js
  I-->>G: profile_activities_wellness_events
  G->>G: transform_data.js
  G->>D: wellness_activities_events_summary_txt
  G->>R2: aws_s3_cp_each_file
```

## 4. LLM이 데이터를 읽는 순서 (권장)

```mermaid
sequenceDiagram
  participant L as LLM_에이전트
  participant W as Worker_GET_data
  participant P as prompt_txt_URL

  L->>W: fetch_JSON
  W-->>L: summary_wellness_activities_events
  L->>P: fetch_코칭_가이드
  P-->>L: prompt_본문
  Note over L: 두_URL_모두_성공한_뒤_분석_응답
```

## 5. 로컬에서만 동기화할 때 (선택)

CI 없이 `npm run sync`만 실행하면 `data/*.txt`가 로컬에만 생긴다. R2 업로드는 Actions와 동일하게 AWS CLI `aws s3 cp`로 수동 수행하거나, 워크플로를 `workflow_dispatch`로 돌린다. 주기 실행이 필요하면 Secrets 등록 후 `.github/workflows/intervals-sync.yml`의 `schedule`을 옵트인한다.

```mermaid
flowchart LR
  dev[로컬_PC]
  intervals[Intervals_API]
  files[data_txt]

  dev -->|npm_run_sync| intervals
  intervals --> files
```

---

더 읽을 것: [README.md](../README.md), [ELIGIBILITY.md](ELIGIBILITY.md), [knowledge/README.md](knowledge/README.md)
