# 공개용 작업 트리

이 폴더는 `intervals-sync` 워크스페이스에서 **개인 데이터·로컬 산출물을 제외**하고 복사한 뒤 `git init`한 저장소다.

## 동기화할 때 (원본 → 여기)

원본 경로에서 아래와 같이 **제외 규칙**을 맞춰 다시 복사하면 된다 (개인 `data/*.txt`, `.wrangler` 등은 넣지 않음).

```bash
rsync -a \
  --exclude='.git' \
  --exclude='worker/.wrangler' \
  --exclude='node_modules' \
  --exclude='worker/node_modules' \
  --exclude='data/wellness.txt' \
  --exclude='data/activities.txt' \
  --exclude='data/events.txt' \
  --exclude='data/prompt.txt' \
  --exclude='data/summary.txt' \
  --exclude='data/*.json' \
  --exclude='data/system-prompt.txt' \
  --exclude='data/.DS_Store' \
  /path/to/intervals-sync/ /path/to/intervals-coach-public/
```

이후 `git status`로 변경만 검토하고 커밋하면 된다.

## GitHub에 올릴 때

```bash
cd /path/to/intervals-coach-public
git remote add origin git@github.com:YOUR_USER/YOUR_PUBLIC_REPO.git
git push -u origin main
```
