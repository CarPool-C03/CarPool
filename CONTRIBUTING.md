# Come contribuire a CarPool

Questa guida spiega come una modifica arriva nel `main`, dal branch al merge.
Vale per tutti, anche quando il codice lo scrive un agente (Copilot o OpenCode):
in quel caso alcune fasi partono con le label, come spiegato in
[docs/agentic-workflow.md](docs/agentic-workflow.md).

**Regola d'oro: nessuno lavora né fa push direttamente su `main`.** Ogni modifica
passa da un branch e da una pull request approvata da un Project Manager
(Giuseppe D'Ambrosio o Pietro Coticella) diverso dall'autore, con la CI verde.
Chi apre la PR deve saper spiegare tutto il codice, anche se l'ha scritto un agente.

## Il flusso in breve

1. Aggiorna il `main` locale
2. Crea un branch per il tuo task Jira
3. Lavora e fai i commit
4. Fai il push del branch
5. Apri la pull request (il template si compila in automatico)
6. CI, revisore automatico e un PM controllano; tu correggi se serve
7. Squash and merge, poi cancelli il branch

## 0. Prima volta: clona il repository

```bash
git clone https://github.com/CarPool-C03/CarPool.git
cd CarPool
```

Su Windows PowerShell 5.1 `&&` non funziona: scrivi i comandi uno per riga.

## 1. Aggiorna il `main` locale

```bash
git switch main
git pull
```

## 2. Crea il tuo branch

Ogni branch corrisponde a **un solo task Jira** (e, se è sviluppo, a un solo
caso d'uso). Formato: `<tipo>/<ID-Jira>-<descrizione-breve>`.

| Tipo | Quando si usa | Esempio |
|---|---|---|
| `feature` | nuova funzionalità | `feature/CP-12-pubblicazione-viaggio` |
| `fix` | correzione di un difetto | `fix/CP-30-errore-login` |
| `test` | solo test | `test/CP-41-test-prenotazione` |
| `docs` | documentazione e modelli (RAD, SDD, ODD, PlantUML, category partition) | `docs/CP-8-scenari-rad` |
| `chore` | configurazione, CI, pipeline, struttura del repository | `chore/CP-50-cartelle-progetto` |

Tutto minuscolo, parole separate da trattini, niente spazi né accenti.

```bash
git switch -c feature/CP-12-pubblicazione-viaggio
```

## 3. Lavora e fai i commit

Commit piccoli e frequenti. Formato del messaggio (lo stesso usato dagli agenti,
vedi `AGENTS.md`):

```
CP-<n> UC_<PKG>_<n>: descrizione (RF_...)
```

```bash
git status
git add .
git commit -m "CP-12 UC_TRIP_01: aggiunge il controllo dei posti disponibili (RF_TRIP_02)"
```

Se il commit non riguarda un caso d'uso (documentazione, configurazione) il caso
d'uso si omette: `CP-8: aggiunge gli scenari al RAD`.
Messaggi da evitare: `fix`, `modifiche`, `aaa`, `ultima versione`.

**I test** si scrivono dai test frame del caso d'uso (`docs/test/cp_UC_<PKG>_<n>.md`),
con l'identificativo del caso di test nel nome (es. `TC_TRIP_01.04 - ...`).
L'esito atteso si prende dal caso d'uso, mai dal comportamento del codice.

Prima del push esegui, nelle cartelle che hai toccato (`backend/` o `frontend/`):

```bash
npm run lint
npm test
```

## 4. Fai il push del branch

```bash
git push -u origin feature/CP-12-pubblicazione-viaggio   # la prima volta
git push                                                  # le volte successive
```

## 5. Apri la pull request

1. Su GitHub clicca **Compare & pull request** (oppure **Pull requests → New pull request**, base `main`).
2. **Titolo**: `CP-12 UC_TRIP_01: Pubblicazione di un viaggio verso la sede`.
3. **Descrizione**: GitHub propone il template (`.github/pull_request_template.md`).
   Compilalo tutto: task, caso d'uso, requisiti, `closes #<issue>`, artefatti usati,
   agenti e tentativi, modifiche ai modelli, dichiarazione finale.
4. Il revisore non si sceglie: GitHub assegna la review ai Project Manager
   (team `project-managers`, file `.github/CODEOWNERS`).
5. Se il lavoro non è finito, scegli **Create draft pull request**. Quando è pronto
   clicca **Ready for review**: partono la CI e l'agente revisore.

## 6. La review

Su ogni PR girano in automatico:

- **CI** (`.github/workflows/ci.yml`): job `build` (lint e test) e job `guardia`
  (segnala test modificati o disattivati, nuove dipendenze, file fuori dalle cartelle previste);
- **agente revisore**: confronta il codice con i modelli e commenta le differenze.

**Per chi fa la review (Project Manager diverso dall'autore):**

1. Leggi prima il commento del revisore automatico e gli avvisi di `guardia`.
2. Apri **Files changed** partendo dalla lista dei file e da `package.json`.
3. Controlla la checklist e la Definition of Done in
   [docs/agentic-workflow.md](docs/agentic-workflow.md): ordine delle chiamate come
   nel sequence (o nel piano approvato), un test per ogni test frame, nessun test
   esistente modificato senza motivazione, nessuna dipendenza non approvata.
4. Fai almeno una domanda all'autore su un punto delicato: deve saperlo spiegare.
5. **Review changes** → **Approve**, **Request changes** (spiegando cosa) o **Comment**.

**Per l'autore:** correggi sullo **stesso branch**, poi commit e push. La PR si
aggiorna da sola. Rispondi ai commenti e clicca **Resolve conversation**.

```bash
git add .
git commit -m "CP-12 UC_TRIP_01: corregge la validazione della data come da review"
git push
```

## 7. Merge nel `main`

Quando la PR è approvata, la CI è verde e non ci sono conflitti:

1. **Squash and merge** → **Confirm**: i commit del branch diventano uno solo.
2. **Delete branch**.
3. Sul tuo computer:

```bash
git switch main
git pull
git branch -D feature/CP-12-pubblicazione-viaggio
```

Con lo squash serve `-D` maiuscolo: Git non riconosce il branch come già unito.

4. Aggiorna lo stato del task su Jira e del requisito (`Implementato`).

## Problemi frequenti

**Il `main` è andato avanti mentre lavoravi (o GitHub segnala conflitti):**

```bash
git switch main
git pull
git switch feature/CP-12-pubblicazione-viaggio
git merge main
```

Nei file in conflitto trovi blocchi `<<<<<<<` / `=======` / `>>>>>>>`: tieni la
versione giusta (o uniscile), cancella i marcatori, poi `git add .`,
`git commit -m "CP-12: risolve i conflitti con main"` e `git push`.
Se non sei sicuro, **chiedi sul canale Discord** prima di cancellare codice di altri.

**Ho fatto commit sul `main` per sbaglio (senza push):**

```bash
git switch -c feature/CP-12-pubblicazione-viaggio
git switch main
git reset --hard origin/main
git switch feature/CP-12-pubblicazione-viaggio
```

**Ho lavorato senza aver fatto `git pull` prima:** segui «Il `main` è andato avanti».

## Riepilogo dei comandi

| Cosa | Comando |
|---|---|
| Aggiornare il main | `git switch main`, poi `git pull` |
| Creare un branch | `git switch -c feature/CP-XX-descrizione` |
| Vedere le modifiche | `git status` |
| Fare un commit | `git add .`, poi `git commit -m "CP-XX UC_XXX_XX: descrizione"` |
| Primo push del branch | `git push -u origin <nome-branch>` |
| Push successivi | `git push` |
| Portare il main nel branch | `git merge main` (dal tuo branch) |
| Cancellare il branch dopo lo squash | `git branch -D <nome-branch>` |
