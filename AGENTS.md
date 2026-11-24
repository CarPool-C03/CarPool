# CarPool

Istruzioni per tutti gli agenti di programmazione (OpenCode, GitHub Copilot),
usati **in locale** dagli sviluppatori. Le legge ogni agente all'inizio di ogni
sessione: tenerle brevi e aggiornate. Si modificano solo con una PR approvata
da un Project Manager.

## Contesto
Web app di carpooling per membri verificati di aziende e atenei: tragitti
ricorrenti verso la sede e viaggi verso eventi. Progetto C03, UniSa.
Lo sviluppo è **bottom-up** dal database: `docs/sviluppo-bottom-up.md`.
- RAD (casi d'uso, requisiti `docs/rad/requisiti.md`, mockup `docs/rad/mockup/`): `docs/rad/`
- Contratto delle API REST (endpoint, campi, errori): `docs/api/`
- Modelli (class, sequence e statechart diagram, PlantUML): `docs/modelli/`
- SDD (sottosistemi, deployment, schema del database): `docs/sdd/`
- ODD (design pattern Facade, Adapter, Observer, Strategy): `docs/odd/`
- Category partition e test frame (TCS): `docs/test/`

## Stack e comandi
Frontend React + Fluent UI in `frontend/`, backend Node.js + Express (API REST)
in `backend/`, database PostgreSQL (connessione TLS, solo da `subsystems/persistenza/`).
Un'attività pianificata nel backend conclude i viaggi due ore dopo la partenza.
Ogni cartella ha il suo `package.json`.
- Installazione: `npm ci` (dentro `backend/` o `frontend/`)
- Lint: `npm run lint` · Test: `npm test`
- Migrazioni (backend): `npm run db:migrate` · nuova migrazione:
  `npm run db:migrate:nuova -- <nome>` · Seed: `npm run db:seed`
- Database locali: `docker compose up -d` (sviluppo 5432, test 5433); i test
  usano sempre il database di test.
- Verifica completa prima di dichiarare finito: lint e test in tutte le
  cartelle toccate. Gli stessi comandi li esegue la CI (`.github/workflows/ci.yml`).

## Struttura del repository
- `backend/src/subsystems/` — una cartella per sottosistema (ODD, `docs/sdd/README.md`):
  `account/`, `organizzazioni/`, `viaggiPrenotazioni/`, `valutazioniMessaggi/`,
  `reportistica/`, `notifiche/`, `persistenza/`, `logging/`. Ognuna espone un solo
  Service (Facade, es. `ViaggioPrenotazioneService.js`) e contiene le sue classi interne.
- `backend/src/routes/` — route REST (es. `viaggiRouter.js`): chiamano solo i Service applicativi.
- `backend/migrations/` — migrazioni del database; `backend/seeds/` — dati di prova.
- `backend/test/`, `frontend/src/**/*.test.*` — test.
- `frontend/src/` — componenti e pagine React.

## Convenzioni
- Nomi di classi, attributi e metodi: esattamente come nel class diagram
  (`docs/modelli/CD_CP_01_Entity.puml`, `docs/modelli/CD_CP_02_Boundary_Control.puml`)
  e nell'ODD (`docs/odd/README.md`). Tabelle, colonne e vincoli: come in
  `docs/sdd/CD_persistenza.puml` (e le scelte dello schema documentate in `docs/sdd/`).
  Campi delle API: come in `docs/api/`. Non tradurre e non rinominare.
- Import tra cartelle del backend: solo le dipendenze ammesse in
  `docs/sdd/README.md`, sempre tramite il Service dell'altro sottosistema.
- Ordine delle chiamate: come nel sequence diagram del caso d'uso
  (`docs/modelli/SD_CP_<nn>_*.puml`, corrispondenze in `docs/modelli/README.md`).
- Stati e transizioni di Account, RichiestaPrenotazione e Viaggio: come negli
  statechart `docs/modelli/SCD_CP_<nn>_*.puml`, comprese le guardie.
- Identificativi: casi d'uso `UC_<PKG>_<n>`, requisiti `RF_<PKG>_<n>`, test frame
  `TF<nn>` dentro `docs/test/cp_UC_<PKG>_<n>.md`, task Jira `C03-<n>`.
- Branch: `<tipo>/C03-<n>-<descrizione>` (vedi `CONTRIBUTING.md`).
- Commit: `C03-<n> UC_<PKG>_<n>: descrizione (RF_...)`; senza caso d'uso: `C03-<n>: descrizione`.
- Nome dei test: per i casi d'uso contiene l'identificativo del caso di test del
  TCS, es. `TC_TRIP_06.03 - posti esauriti: la richiesta resta In attesa`; per L1–L2 descrive il vincolo
  o la funzione provata, es. `Valutazione: rifiuta un punteggio fuori da 1..5`.

## Regole
### Sempre
- Lavora solo nel branch del task e solo sui file dell'ambito del piano.
- Leggi i file elencati nella sezione «Specifica» della issue, più questi file di
  istruzioni. Solo il pianificatore, se non bastano, cerca anche nel resto di `docs/`.
- Scrivi i test indicati nella sezione «Verifica» della issue.
- **Nessun file oltre le 200 righe**: se un file cresce, dividilo per responsabilità.
- Esegui lint e test prima di dichiarare il lavoro finito.

### Chiedi prima (fermati e scrivilo nella risposta o nella PR)
- Classi, metodi, tabelle o endpoint non presenti nei modelli, in `docs/api/` o nella issue.
  Quelli scritti nella issue (Cosa fare, Decisioni del PM) sono già approvati dal PM.
- Modifiche a codice condiviso da più task (PersistenzaService, Service di altri sottosistemi).
- Nuove dipendenze npm (vanno approvate dal PM: esistenza, manutenzione, licenza).
- Specifica incompleta o documenti in contrasto: il **pianificatore** propone il piano con
  le ipotesi e la «Documentazione da aggiungere», oppure, se il punto è bloccante, solo
  l'elenco «Da modificare prima di andare avanti». Lo sviluppatore aggiorna `docs/` nel
  branch del task. Implementatore e tester non scelgono: davanti a un buco non coperto
  dal piano si fermano. I contrasti già risolti sono in `docs/modelli/README.md`.

### Mai
- Modificare una migrazione già presente nel `main`: si aggiunge una nuova migrazione.
- Accedere al database fuori da `subsystems/persistenza/`, o al provider e-mail
  fuori da `subsystems/notifiche/`; il frontend chiama solo le API REST.
- Password in chiaro: si memorizza solo l'hash (DG_4).
- Controllo dei posti e accettazione di una richiesta in operazioni separate:
  vanno nella stessa transazione di PersistenzaService (DG_5).
- Dati sui singoli Membri nei report PSCL: solo conteggi aggregati (DG_1).
- Modificare, disattivare o saltare test esistenti per farli passare
  (`.skip`, `.only`, asserzioni rimosse).
- Push su `main` o push in generale: commit e push li fa lo sviluppatore.
- Modifiche a `.github/`, `AGENTS.md`, `.opencode/`, `opencode.json`.
- Credenziali, chiavi o dati personali reali nel codice o nei test: usa
  variabili d'ambiente (`.env.example`) e dati fittizi.

## Quando un task è finito
- Lint e test passano nelle cartelle toccate.
- Ogni test richiesto in «Verifica» esiste e ha il nome nel formato previsto.
- Nessun file modificato fuori dall'ambito del piano approvato.
- Nessun file oltre le 200 righe.

## Documenti di riferimento
Da leggere solo quando il task li cita:
- Livelli e ordine di sviluppo: `docs/sviluppo-bottom-up.md`
- Flusso di lavoro del team: `CONTRIBUTING.md`, `docs/guida-agenti-in-locale.md`
- Template dei casi d'uso e della category partition: `docs/rad/uc/_TEMPLATE.md`,
  `docs/test/_TEMPLATE.md`
