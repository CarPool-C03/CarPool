# CarPool

Istruzioni per tutti gli agenti di programmazione (GitHub Copilot, OpenCode).
Le legge ogni agente all'inizio di ogni sessione: tenerle brevi e aggiornate.
Si modificano solo con una PR approvata da un Project Manager.

## Contesto
Web app di carpooling per membri verificati di aziende e atenei: tragitti
ricorrenti verso la sede e viaggi verso eventi. Progetto C03, UniSa.
- RAD (casi d'uso, requisiti): `docs/rad/`
- SDD (component e deployment): `docs/sdd/`
- Modelli (class, sequence e statechart diagram, PlantUML): `docs/modelli/`
- Category partition e test frame: `docs/test/`

## Stack e comandi
Frontend React in `frontend/`, backend Node.js + Express (API REST) in
`backend/`, database PostgreSQL. Ogni cartella ha il suo `package.json`.
- Installazione: `npm ci` (dentro `backend/` o `frontend/`)
- Lint: `npm run lint`
- Test: `npm test`
- Verifica completa prima di dichiarare finito: lint e test in entrambe le
  cartelle toccate. Gli stessi comandi li esegue la CI (`.github/workflows/ci.yml`).

## Struttura del repository
- `backend/src/` — codice del backend, organizzato come nel component diagram
  (`docs/sdd/component.puml`): boundary (route/API), control (logica dei casi
  d'uso), entity/model, storage (accesso al DB).
- `backend/test/`, `frontend/src/**/*.test.*` — test.
- `frontend/src/` — componenti e pagine React.

## Convenzioni
- Nomi di classi, attributi, metodi e tabelle: esattamente come nel class
  diagram (`docs/modelli/CD_CP_01_Entity.puml` per le entity,
  `docs/modelli/CD_CP_02_Boundary_Control.puml` per boundary e control).
  Non tradurre e non rinominare.
- Ordine delle chiamate: come nel sequence diagram del caso d'uso
  (`docs/modelli/SD_CP_<nn>_*.puml`, corrispondenze in `docs/modelli/README.md`).
- Stati e transizioni di Account, RichiestaPrenotazione e Viaggio: come negli
  statechart `docs/modelli/SCD_CP_<nn>_*.puml`, comprese le guardie.
- Identificativi: casi d'uso `UC_<PKG>_<n>` (es. `UC_TRIP_01`), requisiti
  `RF_<PKG>_<n>`, test frame `TF<nn>` dentro `docs/test/cp_<UC>.md`.
- Branch: `<tipo>/CP-<n>-<descrizione>` (vedi `CONTRIBUTING.md`).
- Commit: `CP-<n> UC_<PKG>_<n>: descrizione (RF_...)`; senza caso d'uso: `CP-<n>: descrizione`.
- Nome di ogni test: contiene l'identificativo del caso di test del TCS
  (`TC_<UC>.<nn>`, dove nn è il test frame), es. `TC_TRIP_06.03 - posti esauriti: rifiuta`.

## Regole
### Sempre
- Lavora solo nel branch del task e solo sui file dell'ambito del piano.
- Scrivi un test per ogni test frame indicato nel task.
- Esegui lint e test prima di dichiarare il lavoro finito.
- Leggi solo i file elencati nella sezione «Specifica» del task, più questi
  file di istruzioni.

### Chiedi prima (fermati e scrivilo nel commento o nella PR)
- Classi, metodi, tabelle o endpoint non presenti nei modelli.
- Modifiche a model o storage condivisi da più casi d'uso.
- Nuove dipendenze npm (vanno approvate dal PM: esistenza, manutenzione, licenza).
- Due modelli in contrasto tra loro, o specifica incompleta: segnala, non scegliere.

### Mai
- Il frontend o le route che accedono direttamente allo storage o al database.
- Modificare, disattivare o saltare test esistenti per farli passare
  (`.skip`, `.only`, asserzioni rimosse).
- Push su `main`, modifiche a `.github/`, `AGENTS.md`, `.opencode/`, `opencode.json`.
- Credenziali, chiavi o dati personali reali nel codice o nei test: usa
  variabili d'ambiente (`.env.example`) e dati fittizi.

## Quando un task è finito
- Lint e test passano nelle cartelle toccate.
- Ogni test frame del task ha un test con l'identificativo `TC_<UC>.<nn>` nel nome.
- Nessun file modificato fuori dall'ambito del piano approvato.
- La PR usa `.github/pull_request_template.md` compilato.

## Documenti di riferimento
Da leggere solo quando il task li cita:
- Flusso di lavoro del team: `CONTRIBUTING.md`
- Uso della pipeline agentica: `docs/agentic-workflow.md`
- Template dei casi d'uso e della category partition: `docs/rad/uc/_TEMPLATE.md`,
  `docs/test/_TEMPLATE.md`
