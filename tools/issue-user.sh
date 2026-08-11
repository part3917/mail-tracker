#!/usr/bin/env bash
# 사용자 토큰 발급 — 지인 한 명당 1회 실행
#   ./tools/issue-user.sh "홍길동"
set -euo pipefail
NAME="${1:?사용법: ./tools/issue-user.sh \"이름\"}"
TOKEN="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)"
META="$(printf '{"name":%s,"createdAt":"%s"}' "$(printf '%s' "$NAME" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')" "$(date -u +%Y-%m-%dT%H:%M:%SZ)")"
npx wrangler kv key put --binding=TRACKER --remote "u:${TOKEN}:__meta__" "$META"
echo
echo "발급 완료 — ${NAME}"
echo "  토큰: ${TOKEN}"
echo "  확장 팝업의 'Your access token' 칸에 붙여넣게 전달하세요."
echo "  회수: npx wrangler kv key delete --binding=TRACKER --remote \"u:${TOKEN}:__meta__\""
