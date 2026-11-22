#!/usr/bin/env bash
# Crea (o aggiorna) le label delle fasi della pipeline agentica.
# Uso: scripts/setup-labels.sh [owner/repo]   (richiede gh autenticato con ruolo Admin o Write)
set -euo pipefail
REPO="${1:-CarPool-C03/CarPool}"

crea() {
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force
}

crea "task-agente"          "0E8A16" "Task svolto con agenti"
crea "task"                 "C5DEF5" "Task svolto senza agenti"
crea "fase:piano"           "FBCA04" "Avvia l'agente pianificatore (PM)"
crea "fase:implementazione" "1D76DB" "Piano approvato: avvia l'implementazione"
crea "fase:test"            "5319E7" "Avvia l'agente tester sulla PR"
crea "fase:revisione"       "B60205" "Avvia di nuovo l'agente revisore sulla PR"
crea "prova"                "EDEDED" "Avvia il workflow di prova Saluto"

gh label list --repo "$REPO"
