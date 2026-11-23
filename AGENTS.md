# CarPool

Istruzioni per tutti gli agenti di programmazione (GitHub Copilot, OpenCode).
Le legge ogni agente all'inizio di ogni sessione: tenerle brevi e aggiornate.
Si modificano solo con una PR approvata da un Project Manager.

## Contesto
Web app di carpooling per membri verificati di aziende e atenei: tragitti
ricorrenti verso la sede e viaggi verso eventi. Progetto C03, UniSa.
- RAD (casi d'uso, requisiti): `docs/rad/`
- SDD (sottosistemi, deployment, schema del database): `docs/sdd/`
- Modelli (class, sequence e statechart diagram, PlantUML): `docs/modelli/`
- Category partition e test frame: `docs/test/`

## Stack e comandi
Frontend React + Fluent UI in `frontend/`, backend Node.js + Express (API REST)
in `backend/`, database PostgreSQL (connessione TLS, solo da `persistenza/`).
Un'attività pianificata nel backend conclude i viaggi due ore dopo la partenza.
Ogni cartella ha il suo `package.json`.
- Installazione: `npm ci` (dentro `backend/` o `frontend/`)
- Lint: `npm run lint`
- Test: `npm test`
- Verifica completa prima di dichiarare finito: lint e test in entrambe le
  cartelle toccate. Gli stessi comandi li esegue la CI (`.github/workflows/ci.yml`).

## Struttura del repository
- `backend/src/` — una cartella per sottosistema dell'SDD (`docs/sdd/README.md`):
  `account/`, `viaggi/`, `organizzazioni/`, `reportistica/`, `comunita/`,
  `notifiche/`, `persistenza/`, `logging/`. Ognuna espone un solo Service
  (Facade, es. `ViaggioPrenotazioneService`) e contiene i suoi control e model.
- `backend/src/api/` — route REST: chiamano solo i Service applicativi.
- `backend/test/`, `frontend/src/**/*.test.*` — test.
- `frontend/src/` — componenti e pagine React.

## Convenzioni
- Nomi di classi, attributi e metodi: esattamente come nel class diagram
  (`docs/modelli/CD_CP_01_Entity.puml` per le entity,
  `docs/modelli/CD_CP_02_Boundary_Control.puml` per boundary e control).
  Tabelle, colonne e vincoli: come in `docs/sdd/CD_persistenza.puml`.
  Non tradurre e non rinominare.
- Import tra cartelle del backend: solo le dipendenze ammesse in
  `docs/sdd/README.md`, sempre tramite il Service dell'altro sottosistema.
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
- Accedere al database fuori da `persistenza/`, o al provider e-mail fuori da
  `notifiche/`; il frontend chiama solo le API REST.
- Password in chiaro: si memorizza solo l'hash (DG_4).
- Controllo dei posti e accettazione di una richiesta in operazioni separate:
  vanno nella stessa transazione di PersistenzaService (DG_5).
- Dati sui singoli Membri nei report PSCL: solo conteggi aggregati (DG_1).
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
