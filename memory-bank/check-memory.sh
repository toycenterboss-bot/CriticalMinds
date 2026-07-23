#!/usr/bin/env bash
# Проверка целостности memory-bank. Запускать в начале каждой сессии.
# Всё проверяется механически; код возврата 1 = есть расхождения, чинить ДО работы.
set -u
cd "$(dirname "$0")"
FAIL=0
note() { echo "✗ $1"; FAIL=1; }
ok()   { echo "✓ $1"; }

# 1. Каждый файл в topics/ и plans/ упомянут в index.md
for f in topics/*.md plans/*.md; do
  [ -e "$f" ] || continue
  if ! grep -q "$(basename "$f")" index.md; then
    note "нет строки в index.md: $f"
  fi
done
ok "полнота index.md проверена"

# 2. Лимиты строк
check_limit() {
  local file=$1 limit=$2
  [ -f "$file" ] || return 0
  local n
  n=$(wc -l < "$file")
  if [ "$n" -gt "$limit" ]; then
    note "$file: $n строк (лимит $limit) — обрезать сразу"
  fi
}
check_limit activeContext.md 60
for f in context/*.md; do [ -e "$f" ] && check_limit "$f" 120; done
ok "лимиты строк проверены"

# 3. Оперативка существует
[ -f context/current.md ] || note "нет context/current.md"

# 4. Битые относительные markdown-ссылки внутри банка
while IFS='|' read -r src target; do
  target="${target%%#*}"
  [ -z "$target" ] && continue
  case "$target" in http*|mailto*) continue ;; esac
  dir=$(dirname "$src")
  if [ ! -e "$dir/$target" ] && [ ! -e "$target" ]; then
    note "битая ссылка в $src → $target"
  fi
done < <(grep -RoE '\]\([^)]+\.md[^)]*\)' --include='*.md' index.md activeContext.md README.md backlog.md topics context plans 2>/dev/null \
         | sed -E 's/:\]\(([^)]+)\)/|\1/')
ok "ссылки проверены"

# 5. Свежесть backlog: оперативка правилась, а очередь неделю не трогали
if [ -f backlog.md ] && [ -f context/current.md ]; then
  if [ "$(find context/current.md -newer backlog.md -mtime +7 2>/dev/null)" ]; then
    note "backlog.md отстал от оперативки на 7+ дней — пройти глазами"
  fi
fi

if [ "$FAIL" -eq 0 ]; then
  echo "— memory bank целостен —"
else
  echo "— есть расхождения, чинить до работы —"
fi
exit $FAIL
