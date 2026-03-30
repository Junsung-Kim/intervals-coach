# AI 에이전트·코딩 도구용 안내

Claude Code, Cursor 등으로 이 저장소를 처음 열었을 때의 **최소 맥락**이다. 상세는 [README.md](README.md)를 따른다.

## 이 저장소의 역할

- **공개 템플릿**: Intervals.icu → GitHub Actions → Cloudflare R2 → Worker가 `GET /data`로 JSON을 제공한다.
- **개인 정본 워크스페이스와 공개 복사본을 혼동하지 말 것.** 유지보수자가 원본에서 다시 맞출 때는 [PUBLIC_COPY.md](PUBLIC_COPY.md)의 `rsync` 제외 규칙을 쓴다.

## 커밋·PR에 넣지 말 것

- `data/*.txt` 실데이터(예: `wellness.txt`, `activities.txt`, `prompt.txt`), `data/*.json` — `.gitignore`를 우회하지 말 것. 예외로 버전에 올리는 것은 `data/prompt.example.txt`뿐이다.
- `.env`, `worker/.wrangler/` 등 로컬·비밀 상태
- Intervals API 키, Cloudflare 키, 실 Athlete ID, **실제 배포 URL**(`*.workers.dev`, R2 퍼블릭 URL 등). 문서·예시에는 `YOUR_*` 플레이스홀더를 유지한다.
- 사용자 홈 디렉터리가 드러나는 **절대 경로**(`/Users/...`)

## 디렉터리 요약

| 경로 | 역할 |
|------|------|
| `scripts/` | Intervals fetch, 데이터 변환 |
| `worker/` | Cloudflare Worker 소스·`wrangler.toml` |
| `.github/workflows/` | R2 업로드 동기화(기본은 수동 실행; cron은 Secrets 설정 후 옵트인) |
| `docs/` | WORKFLOW, ELIGIBILITY, HANDOFF, `knowledge/` |
| `data/prompt.example.txt` | LLM용 예시. 실제 `prompt.txt`는 로컬 또는 R2에만 둔다. |

## 로컬·검증 (요약)

- 루트: `npm run sync`(필요 시 `INTERVALS_*` 환경변수), 이후 `node scripts/transform_data.js` 등은 README 참고.
- Worker만: `cd worker && npm install && npm run dev` / `npx wrangler deploy`.

변경 후에는 `git status`로 개인 데이터·비밀이 스테이징되지 않았는지 확인한다.
