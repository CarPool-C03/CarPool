# Implementare una issue con gli agenti in locale

Guida rapida per i team member. Una issue = un branch = una pull request.
Gli agenti scrivono, **tu decidi e rispondi del codice**: alla review devi
saper spiegare ogni riga. Regole complete: [CONTRIBUTING.md](../CONTRIBUTING.md);
livelli e ordine dei task: [sviluppo-bottom-up.md](sviluppo-bottom-up.md).

```
issue ─► branch ─► 1 pianificatore ─► ✋ approvi il piano ─► 2 implementatore
      ─► 3 tester (sessione nuova) ─► push + PR bozza ─► 4 revisore ─► Ready for review ─► PM
```

## 0. Prima di iniziare (una volta sola)

- **Installa**: Node.js 22+, Git, Docker Desktop, VS Code; poi segui
  «Installazione e avvio» nel [README](../README.md) fino a `npm test` verde.
- **VS Code**: apri sempre la cartella **radice** del repo (`CarPool`), non
  `backend/`: altrimenti gli agenti non trovano `AGENTS.md`. Attiva
  **File → Salvataggio automatico**: gli agenti scrivono sul disco.
- **Windows**: come terminale di VS Code usa **Git Bash** o PowerShell 7
  (PowerShell 5.1 non accetta `&&`).
- **Un agente a scelta**:
  - **OpenCode**, lanciato con `opencode` dal terminale di VS Code. Serve
    [GitHub CLI](https://cli.github.com/): `gh auth login`, poi `gh auth status`
    nel terminale di VS Code deve dirti che sei autenticato (se hai installato
    `gh` con VS Code aperto, riavvia VS Code).
  - **Copilot**: chat in modalità **Agent**; gli agenti di `.github/agents/`
    compaiono nel menu. **Non attivare l'approvazione automatica dei comandi**:
    è ciò che impedisce all'agente di fare push o altro al posto tuo.
- Mai OpenCode e Copilot insieme sulla stessa issue.

## 1. Prendi la issue

1. Apri la issue assegnata a te su GitHub e controlla che abbia il codice
   Jira all'inizio del titolo (`[C03-n]`), il livello (L0–L5) e le sezioni
   Specifica, Ambito e Verifica compilate.
2. Controlla **«Dipende da»**: le issue indicate devono essere già mergiate,
   altrimenti costruiresti su codice che nel `main` non c'è ancora.
3. Se manca qualcosa o non è chiaro, **chiedi al PM prima di partire**.
4. Su Jira sposta il task in *In corso*. Avvia i database: `docker compose up -d`.

## 2. Crea il branch dal `main` aggiornato

```bash
git switch main
git pull
git switch -c feature/C03-12-pubblicazione-viaggio
```

Formato: `<tipo>/C03-<n>-<descrizione>`: il codice è quello tra parentesi quadre
nel titolo della issue (`[C03-12]`), la descrizione è minuscola con i trattini.
`feature` per codice nuovo (anche migrazioni e accesso ai dati), `fix` per difetti,
`chore` per configurazione, `docs` per documenti, `test` per soli test.

**Due issue in parallelo?** Non cambiare branch con modifiche a metà: crea una
seconda cartella con `git worktree add ../carpool-C03-15 -b feature/C03-15-ricerca-viaggio`
e aprila in una **nuova finestra** di VS Code. A lavoro mergiato:
`git worktree remove ../carpool-C03-15`.

## 3. Usa i 4 agenti, uno alla volta

- **Un agente per fase**, nell'ordine sotto. Non chiedere all'implementatore di
  "fare anche i test".
- Leggi sempre cosa propone prima di accettare modifiche: rispondi tu alle
  richieste di conferma, non in automatico.
- **OpenCode** legge da solo issue e commenti con `gh`: basta il numero della
  issue. Scegli l'agente con **Tab** o scrivendo `@pianificatore …`; `/new`
  apre una sessione nuova.
- **Copilot non legge GitHub**: scegli l'agente dal menu della chat e **incolla**
  nel messaggio il testo della issue (e, per l'implementatore, il piano).

### 3.1 Pianificatore — propone il piano (non modifica file)

- *OpenCode*: `@pianificatore Proponi il piano per la issue #21.`
- *Copilot*: `Proponi il piano per questa issue:` + testo della issue incollato.

Il pianificatore risponde in uno di tre modi:
- **Piano senza ipotesi**: controlla file dentro l'Ambito, nomi come nei modelli e in
  `docs/api/`, ordine delle chiamate come nel sequence (L4), test di «Verifica» elencati.
- **Piano con «Ipotesi» e «Documentazione da aggiungere»**: scrivi (o correggi) i testi
  proposti nei file di `docs/` indicati, commit `C03-12: documentazione …`, poi approva.
- **Solo «Da modificare prima di andare avanti»**: aggiorna i documenti indicati, commit,
  e rilancia il pianificatore in una **sessione nuova**. Se serve una decisione di progetto
  (due documenti in contrasto, una regola del caso d'uso), chiedila prima al PM.

Le modifiche a `docs/` vanno nella stessa PR e le rivede il PM.

### ✋ Approva il piano

Copia il piano in un commento della issue con il titolo **«Piano approvato»**.
È la traccia che il PM controlla in review, e OpenCode lo legge da lì.
Se il piano contiene deviazioni dai modelli, serve l'ok del PM prima di andare avanti.

### 3.2 Implementatore — scrive il codice

- *OpenCode*: `@implementatore Implementa il piano approvato della issue #21: leggilo con gh issue view 21 --comments. Poi esegui lint e test.`
- *Copilot*: `Implementa questo piano approvato. Poi esegui lint e test.` +
  testo della issue + testo del piano, incollati.

L'agente modifica solo i file del piano, esegue `npm run lint` e `npm test`
dentro `backend/` o `frontend/` e fa i commit nel formato
`C03-12 UC_TRIP_01: descrizione (RF_...)` (oppure `C03-7: descrizione` per i task
senza caso d'uso). Il push lo fai tu.

Fermalo e prendi in mano tu se:
- fallisce **3 volte** sullo stesso errore;
- tocca file fuori dal piano, aggiunge dipendenze npm, modifica test esistenti
  o una migrazione già presente nel `main`;
- ti chiede di fare qualcosa che non capisci.

### 3.3 Tester — scrive i test (sessione nuova)

Apri una **sessione nuova** (`/new` in OpenCode, nuova chat in Copilot):
il tester non deve "ricordare" come è stato scritto il codice.
- *OpenCode*: `@tester Scrivi i test della sezione Verifica della issue #21.`
- *Copilot*: `Scrivi i test della sezione Verifica:` + testo della issue incollato.

Il tester tocca solo file di test e prende l'esito atteso dalla specifica:
- **L4**: un test per test frame, con `TC_TRIP_01.<nn>` nel nome;
- **L1–L2**: un test per vincolo o funzione, sul database di test.

**Se un test fallisce, il difetto è nel codice**: torna all'implementatore (o
correggi tu) senza cambiare il test.

### Verifica tu prima del push

```bash
cd backend      # e/o frontend, nelle cartelle che hai toccato
npm run lint
npm test
cd ..
git status      # nessun file estraneo (.env, file temporanei)
git log --oneline main..HEAD
git fetch origin && bash scripts/guardia-pr.sh origin/main   # facoltativo: avvisi della CI
```

## 4. Push e pull request in bozza

```bash
git push -u origin feature/C03-12-pubblicazione-viaggio
```
Su GitHub: **Compare & pull request** → base `main` → titolo
`C03-12 UC_TRIP_01: Pubblicazione di un viaggio` (o `C03-7: Migrazione di Membro e Veicolo`) →
compila tutto il template (con `closes #21`) → **Create draft pull request**.

## 5. Revisore — confronto con i modelli

Prima della review umana fai controllare la PR al revisore (sessione nuova).
Non modifica file: produce l'elenco delle differenze.

- *OpenCode*: `@revisore Rivedi la pull request #34.` (usa `gh pr diff`).
- *Copilot*: salva la diff nella cartella `.revisione/` (il contenuto non va su git) e
  allegala alla chat insieme al testo della issue:
  ```bash
  git diff main...HEAD --output=.revisione/C03-12.diff
  ```
  `Rivedi questa diff rispetto ai modelli; caso d'uso UC_TRIP_01.`

Per ogni differenza segnalata: correggi (a mano o con l'implementatore) oppure
scrivi nella PR perché è corretta così. Poi `git push`: la PR si aggiorna.

## 6. Ready for review e merge

1. Scrivi nella PR l'esito del revisore e clicca **Ready for review**: parte la
   CI (`build`, `guardia`) e la review va a un PM diverso da te.
2. Rispondi ai commenti correggendo **sullo stesso branch**, poi push.
3. Approvata e CI verde → il PM fa **Squash and merge** e cancella il branch.
4. Pulisci in locale e aggiorna Jira (*Fatto*): `git switch main`, `git pull`,
   `git branch -D feature/C03-12-pubblicazione-viaggio`.

## Checklist della PR

- [ ] Un solo task, branch creato da `main` aggiornato
- [ ] Piano approvato nei commenti della issue
- [ ] Test scritti dal tester in una sessione separata, uno per voce di «Verifica»
- [ ] Lint e test verdi in locale e nella CI
- [ ] Nessun test esistente o migrazione esistente modificati, nessuna dipendenza nuova non approvata
- [ ] Nessun file fuori dall'ambito o oltre 200 righe, nessuna credenziale nel codice
- [ ] Differenze del revisore risolte o motivate nella PR
- [ ] So spiegare tutto il codice

## Problemi frequenti

| Problema | Cosa fare |
|---|---|
| OpenCode non trova la issue o il piano | `gh auth status` nel terminale di VS Code; il commento deve iniziare con «Piano approvato» |
| Copilot dice che manca la issue o il piano | È voluto: incollali nel messaggio |
| L'agente non trova `AGENTS.md` | In VS Code è aperta una sottocartella: apri la radice del repo |
| L'agente vuole un comando non permesso | È voluto (`.opencode/agents/`): eseguilo tu solo se sai cosa fa |
| I test del backend non si collegano al database | `docker compose up -d` e `.env` copiato da `.env.example` |
| `main` è andato avanti / conflitti | `git switch main`, `git pull`, torna al branch, `git merge main` |
| Commit su `main` per sbaglio | Vedi «Problemi frequenti» in CONTRIBUTING.md |
| Il pianificatore chiede documentazione | Aggiungila in `docs/` nel tuo branch; decisioni di progetto al PM |
| Il modello sembra sbagliato | Non correggerlo nel codice: segnalalo al PM nella issue |
