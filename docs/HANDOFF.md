# 별도 로컬 경로에서 템플릿 repo를 처음부터 쓰기

공개 **템플릿 저장소**를 GitHub에 만들었고, 지인이 **fork**하지 않고 **새 빈 repo**에만 옮기고 싶을 때의 절차다. 일반적으로는 **Fork가 더 쉽다**([README.md](../README.md) Fork 절 참고).

## 1. GitHub에서 빈 public repo 생성

예: `intervals-coach-sync`

## 2. 로컬에서 clone

```bash
mkdir -p ~/src
git clone git@github.com:YOUR_USERNAME/intervals-coach-sync.git ~/src/intervals-coach-sync
cd ~/src/intervals-coach-sync
```

HTTPS를 쓰면 URL만 바꾸면 된다.

## 3. 템플릿에서 복사할 경로

다음 디렉터리·파일을 **정본 템플릿**에서 복사한다.

- `scripts/`
- `worker/` (단, `worker/.wrangler/`는 복사하지 않음)
- `.github/workflows/`
- 루트 `package.json`, `.gitignore`, `LICENSE`, `README.md`
- `docs/` 전체
- `data/prompt.example.txt` → 로컬에서는 `data/prompt.txt`로 복사해 쓰되 **커밋하지 않음** (`.gitignore`에 의해 제외)

## 4. 복사하지 말 것

- `data/*.txt` 실데이터, `data/*.json`
- `worker/.wrangler/`, `.env`
- 기타 로컬 캐시·sqlite

## 5. 첫 커밋 전 확인

```bash
git add -A
git status
```

`data/wellness.txt` 같은 개인 파일이 올라가면 안 된다. 문제 없으면:

```bash
git commit -m "Initial import from intervals-coach template"
git push -u origin main
```

## 6. 그다음

[README.md](../README.md)의 **Fork 후 설정**, **Cloudflare**, **Secrets** 순으로 진행한다. 개인용 URL·`wrangler.toml`의 `bucket_name`은 **본인 계정** 기준으로만 설정한다.
