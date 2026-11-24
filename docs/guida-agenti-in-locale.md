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

- Repository clonato: `git clone https://github.com/CarPool-C03/CarPool.git`
- Uno dei due agenti installato:
  - **OpenCode** (terminale): legge da solo `AGENTS.md` e `opencode.json`.
  - **Copilot in VS Code**: Copilot Chat in modalità **Agent**; gli agenti
    di `.github/agents/` compaiono nel menu degli agenti.
- Consigliato: [GitHub CLI](https://cli.github.com/) con `gh auth login`,
  così OpenCode legge l'issue da solo (`gh issue view`).

## 1. Prendi la issue

1. Apri la issue assegnata a te su GitHub e controlla che abbia il codice
   Jira all'inizio del titolo (`[C03-n]`), il livello (L0–L5) e Specifica, Ambito e Verifica compilati.
2. Controlla **«Dipende da»**: le issue indicate devono essere già mergiate,
   altrimenti costruiresti su codice che nel `main` non c'è ancora.
3. Se manca qualcosa o non è chiaro, **chiedi al PM prima di partire**.
4. Su Jira sposta il task in *In corso*.

## 2. Crea il branch dal `main` aggiornato

Ogni issue ha il **suo** branch, creato sempre da un `main` aggiornato.

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
seconda cartella di lavoro collegata allo stesso repository.

```bash
git worktree add ../carpool-C03-15 -b feature/C03-15-ricerca-viaggio
cd ../carpool-C03-15        # apri l'agente qui
# a lavoro finito e mergiato:
git worktree remove ../carpool-C03-15
```

## 3. Usa i 4 agenti, uno alla volta

Regole valide per tutti:
- **Un agente per fase**, nell'ordine sotto. Non chiedere all'implementatore di
  "fare anche i test".
- Dai all'agente **solo** la issue e i file della sezione Specifica.
- Leggi sempre cosa propone prima di accettare modifiche (OpenCode chiede
  conferma per ogni file: rispondi tu, non in automatico).

**Come si sceglie l'agente**
- *OpenCode*: avvia `opencode` nella cartella del repo e premi **Tab** fino a
  selezionare l'agente, oppure scrivi `@pianificatore ...` nel messaggio.
  `/new` apre una sessione nuova (contesto pulito).
- *Copilot*: scegli l'agente dal menu in fondo alla chat. Copilot **non legge
  le issue di GitHub**: incolla nel messaggio il testo della issue (e il piano).

### 3.1 Pianificatore — propone il piano (non modifica file)

```
Proponi il piano per la issue #21 (C03-12, UC_TRIP_01).
```
(Con Copilot: incolla anche il testo della issue.)

Controlla il piano: file dentro l'Ambito, nomi come nei modelli (per L1–L2
tabelle e colonne di `docs/sdd/CD_persistenza.puml`), ordine delle chiamate
come nel sequence (L4), tutti i test di «Verifica» elencati, «Deviazioni dai
modelli: nessuna». Se segnala incoerenze tra i modelli (anche quelle già note
in `docs/modelli/README.md`), **fermati e scrivilo al PM**: non scegliere tu.

### ✋ Approva il piano

Copia il piano in un commento della issue con il titolo **«Piano approvato»**.
È la traccia che il PM controlla in review, e l'implementatore lo legge da lì.
Se il piano contiene deviazioni dai modelli, serve l'ok del PM prima di andare avanti.

### 3.2 Implementatore — scrive il codice

Nella stessa cartella, sul tuo branch:
```
Implementa il piano approvato della issue #21. Poi esegui lint e test.
```
L'agente modifica solo i file del piano, esegue `npm run lint` e `npm test`
e fa i commit nel formato `C03-12 UC_TRIP_01: descrizione (RF_...)` (oppure
`C03-7: descrizione` per i task senza caso d'uso). Il push lo fai tu.

Fermalo e prendi in mano tu se:
- fallisce **3 volte** sullo stesso errore;
- tocca file fuori dal piano, aggiunge dipendenze npm, modifica test esistenti
  o una migrazione già presente nel `main`;
- ti chiede di fare qualcosa che non capisci.

### 3.3 Tester — scrive i test (sessione nuova)

Apri una **sessione nuova** (`/new` in OpenCode, nuova chat in Copilot):
il tester non deve "ricordare" come è stato scritto il codice.
```
Scrivi i test della sezione Verifica della issue #21.
```
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
git status      # nessun file estraneo (.env, file temporanei)
git log --oneline main..HEAD
```

## 4. Push e pull request in bozza

```bash
git push -u origin feature/C03-12-pubblicazione-viaggio
```
Su GitHub: **Compare & pull request** → base `main` → titolo
`C03-12 UC_TRIP_01: Pubblicazione di un viaggio` (o `C03-7: Migrazione di Membro e Veicolo`) →
compila tutto il template (con `closes #21`) → **Create draft pull request**.

## 5. Revisore — confronto con i modelli

Prima di chiedere la review umana, fai controllare la PR al revisore
(sessione nuova). Non modifica file: produce l'elenco delle differenze.

- *OpenCode*: `Rivedi la pull request #34.` (usa `gh pr diff`).
- *Copilot*: salva la diff **fuori dal repo** e allegala alla chat:
  ```bash
  git diff main...HEAD > ../revisione-C03-12.diff
  ```
  `Rivedi questa diff rispetto ai modelli; caso d'uso UC_TRIP_01.`

Per ogni differenza segnalata: correggi (a mano o con l'implementatore) oppure
scrivi nella PR perché è corretta così. Poi `git push`: la PR si aggiorna.

## 6. Ready for review e merge

1. Scrivi nella PR l'esito del revisore e clicca **Ready for review**: parte la
   CI (`build`, `guardia`) e la review va a un PM diverso da te.
2. Rispondi ai commenti correggendo **sullo stesso branch**, poi push.
3. Approvata e CI verde → il PM fa **Squash and merge** e cancella il branch.
4. Pulisci in locale e aggiorna Jira (*Fatto*):
   ```bash
   git switch main
   git pull
   git branch -D feature/C03-12-pubblicazione-viaggio
   ```

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
| L'agente non trova la issue | Con Copilot incollala; con OpenCode esegui `gh auth login` |
| L'agente vuole un comando non permesso | È voluto (`opencode.json`): eseguilo tu solo se sai cosa fa |
| `main` è andato avanti / conflitti | `git switch main`, `git pull`, torna al branch, `git merge main` |
| Commit su `main` per sbaglio | Vedi «Problemi frequenti» in CONTRIBUTING.md |
| Il modello sembra sbagliato | Non correggerlo nel codice: segnalalo al PM nella issue |
