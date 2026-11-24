# Come contribuire a CarPool

**Regola d'oro: nessuno lavora né fa push direttamente su `main`.** Ogni
modifica passa da un branch e da una pull request approvata da un Project
Manager (Giuseppe D'Ambrosio o Pietro Coticella) diverso dall'autore, con la
CI verde. Chi apre la PR deve saper spiegare tutto il codice, anche quello
scritto da un agente.

- Ordine di sviluppo (livelli L0–L5): [docs/sviluppo-bottom-up.md](docs/sviluppo-bottom-up.md)
- Passo passo con gli agenti in locale: [docs/guida-agenti-in-locale.md](docs/guida-agenti-in-locale.md)

## Il flusso in breve

1. Prendi la issue GitHub del tuo task Jira (`C03-n`)
2. Crea il branch dal `main` aggiornato
3. Pianifica, implementa e testa (con gli agenti o a mano)
4. Push e pull request in bozza
5. Revisione con l'agente revisore, poi **Ready for review**
6. Review di un PM, correzioni, **Squash and merge**

## Branch

Un branch per **un solo task Jira**. Formato `<tipo>/C03-<n>-<descrizione>`,
con il codice Jira come nel titolo della issue (`[C03-12]` → `C03-12`) e la
descrizione minuscola, parole separate da trattini, niente spazi né accenti.

| Tipo | Quando si usa | Esempio |
|---|---|---|
| `feature` | codice nuovo, comprese migrazioni e accesso ai dati | `feature/C03-7-migrazione-membro-veicolo` |
| `fix` | correzione di un difetto | `fix/C03-30-errore-login` |
| `test` | solo test | `test/C03-41-test-prenotazione` |
| `docs` | documentazione e modelli (RAD, SDD, ODD, PlantUML, TCS) | `docs/C03-8-scenari-rad` |
| `chore` | configurazione, CI, struttura del repository | `chore/C03-1-impostazione-backend` |

```bash
git switch main
git pull
git switch -c feature/C03-7-migrazione-membro-veicolo
```

## Commit

Commit piccoli e frequenti, nel formato (lo stesso usato dagli agenti):

```
C03-<n> UC_<PKG>_<n>: descrizione (RF_...)     # task di un caso d'uso (L4)
C03-<n>: descrizione                           # tutti gli altri task
```

Esempi: `C03-7: aggiunge la migrazione di Membro e Veicolo`,
`C03-12 UC_TRIP_01: controlla i posti offerti (RF_TRIP_01b)`.
Messaggi da evitare: `fix`, `modifiche`, `aaa`, `ultima versione`.

Prima del push, nelle cartelle che hai toccato (`backend/` o `frontend/`):

```bash
npm run lint
npm test
```

## Pull request

1. `git push -u origin <nome-branch>`, poi su GitHub **Compare & pull request**, base `main`.
2. **Titolo**: `C03-12 UC_TRIP_01: Pubblicazione di un viaggio` oppure `C03-7: Migrazione di Membro e Veicolo`.
3. **Descrizione**: compila tutto il template, con `closes #<issue>`.
4. Apri la PR **in bozza** (*Create draft pull request*), esegui in locale
   l'agente revisore (vedi guida) e correggi.
5. Quando è pronta clicca **Ready for review**. La review va in automatico ai
   PM (team `project-managers`, file `.github/CODEOWNERS`).

## La review

Su ogni PR gira la **CI** (`.github/workflows/ci.yml`): job `build` (lint,
test con PostgreSQL di test, build) e job `guardia` (segnala test modificati o
disattivati, nuove dipendenze, file fuori dalle cartelle previste).

**Per chi fa la review (PM diverso dall'autore):**

1. Leggi gli avvisi di `guardia` e l'esito del revisore riportato nella PR.
2. Apri **Files changed** partendo dalla lista dei file e da `package.json`.
3. Controlla la Definition of Done di [docs/sviluppo-bottom-up.md](docs/sviluppo-bottom-up.md):
   file solo nell'ambito, nomi come nei modelli, test del livello presenti,
   migrazioni esistenti non modificate, nessuna dipendenza non approvata.
4. Fai almeno una domanda all'autore su un punto delicato.
5. **Review changes** → **Approve**, **Request changes** (spiegando cosa) o **Comment**.

**Per l'autore:** correggi sullo **stesso branch**, commit e push: la PR si
aggiorna da sola. Rispondi ai commenti e clicca **Resolve conversation**.

## Merge

Con PR approvata, CI verde e nessun conflitto il PM fa **Squash and merge** e
**Delete branch**. Poi in locale:

```bash
git switch main
git pull
git branch -D feature/C03-7-migrazione-membro-veicolo
```

Con lo squash serve `-D` maiuscolo. Infine aggiorna il task su Jira (*Fatto*).

## Problemi frequenti

**Il `main` è andato avanti (o GitHub segnala conflitti):**

```bash
git switch main
git pull
git switch feature/C03-7-migrazione-membro-veicolo
git merge main
```

Nei file in conflitto tieni la versione giusta, cancella i marcatori
`<<<<<<<` / `=======` / `>>>>>>>`, poi `git add .`,
`git commit -m "C03-7: risolve i conflitti con main"` e `git push`.
Se non sei sicuro, chiedi sul canale Discord prima di cancellare codice di altri.

**Ho fatto commit sul `main` per sbaglio (senza push):**

```bash
git switch -c feature/C03-7-migrazione-membro-veicolo
git switch main
git reset --hard origin/main
git switch feature/C03-7-migrazione-membro-veicolo
```

Su Windows PowerShell 5.1 `&&` non funziona: scrivi i comandi uno per riga.
