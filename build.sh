#!/usr/bin/env bash
# 아티팩트(claude.ai) 게시용 dist/ 생성: 바깥 문서 태그를 제거하고 CSS·JS를 복사합니다.
set -e
cd "$(dirname "$0")"
mkdir -p dist
python3 - <<'PY'
import re
s = open('index.html').read()
for pat in [r'<!DOCTYPE html>\s*', r'<html[^>]*>\s*', r'</?head>\s*', r'<body>\s*', r'\s*</body>', r'\s*</html>\s*$', r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*']:
    s = re.sub(pat, '', s, flags=re.I)
open('dist/index.html', 'w').write(s)
PY
cp style.css app.js dist/
echo "dist/ ready"
