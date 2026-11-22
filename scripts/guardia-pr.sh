#!/usr/bin/env bash
# Segnala in una PR i comportamenti a rischio tipici degli agenti.
# Uso: scripts/guardia-pr.sh <branch-base>   (es. origin/main)
# Fallisce solo per i casi che non hanno giustificazione (.only, test
# cancellati, segreti evidenti); per gli altri emette avvisi da controllare.
set -uo pipefail

BASE="${1:-origin/main}"
MERGE_BASE="$(git merge-base "$BASE" HEAD)"
errori=0

cambiati() { git diff --name-only --diff-filter="$1" "$MERGE_BASE" HEAD; }
is_test() { [[ "$1" =~ (^|/)(test|tests|__tests__)/ || "$1" =~ \.(test|spec)\.[jt]sx?$ ]]; }

# 1. Test esistenti modificati o cancellati
while read -r f; do
  [ -z "$f" ] && continue
  if is_test "$f"; then
    echo "::warning file=$f::Test esistente modificato: serve una motivazione scritta nella PR."
  fi
done < <(cambiati M)

while read -r f; do
  [ -z "$f" ] && continue
  if is_test "$f"; then
    echo "::error file=$f::Test esistente cancellato."
    errori=1
  fi
done < <(cambiati D)

# 2. Test disattivati o isolati nelle righe aggiunte
aggiunte="$(git diff -U0 "$MERGE_BASE" HEAD -- '*.js' '*.jsx' '*.ts' '*.tsx' | grep -E '^\+[^+]' || true)"
if echo "$aggiunte" | grep -Eq '\b(it|test|describe)\.only\('; then
  echo "::error::Trovato .only( nei test aggiunti: esegue solo alcuni test."
  errori=1
fi
if echo "$aggiunte" | grep -Eq '\b(it|test|describe)\.skip\(|\bx(it|describe)\('; then
  echo "::warning::Trovato .skip( o xit( nei test aggiunti: un test è stato disattivato."
fi

# 3. Nuove dipendenze npm (vanno approvate dal PM)
while read -r f; do
  [ -z "$f" ] && continue
  if git diff "$MERGE_BASE" HEAD -- "$f" | grep -Eq '^\+\s+"[^"]+":\s*"[~^0-9*]'; then
    echo "::warning file=$f::package.json modificato con possibili nuove dipendenze: serve l'approvazione del PM."
  fi
done < <(git diff --name-only "$MERGE_BASE" HEAD | grep -E '(^|/)package\.json$' || true)

# 4. File di configurazione degli agenti o della pipeline
if git diff --name-only "$MERGE_BASE" HEAD | grep -Eq '^(AGENTS\.md|opencode\.json|\.opencode/|\.github/)'; then
  echo "::warning::La PR modifica la configurazione degli agenti o della pipeline: serve l'approvazione dei PM."
fi

# 5. File fuori dalle cartelle previste
while read -r f; do
  [ -z "$f" ] && continue
  if ! [[ "$f" =~ ^(backend|frontend|docs|scripts|\.github|\.opencode)/ ]]; then
    echo "::notice file=$f::File fuori da backend/, frontend/, docs/: controllare che sia nell'ambito del piano."
  fi
done < <(git diff --name-only "$MERGE_BASE" HEAD)

# 6. Segreti evidenti
if echo "$aggiunte" | grep -Eiq '(sk-[a-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY)'; then
  echo "::error::Possibile chiave o credenziale nelle righe aggiunte."
  errori=1
fi

echo "Elenco dei file modificati:"
git diff --stat "$MERGE_BASE" HEAD | tail -n 50
exit "$errori"
