# Contratto delle API REST

Fonte unica per backend (route e Service) e frontend (`src/api/client.js` e pagine): nomi dei campi,
codici di risposta ed errori si usano **esattamente** come scritti qui. Le scelte sono dei PM; un
endpoint o un campo non presente qui o nella issue va chiesto prima (`AGENTS.md`).

| File | Endpoint | Issue |
|---|---|---|
| [account.md](account.md) | registrazione, verifica, login, logout, utente corrente, profilo, veicolo, eliminazione, membri | #12, #13, #14, #15, #23 |
| [organizzazioni.md](organizzazioni.md) | organizzazioni partner, sedi del Membro | #14 |
| [viaggi.md](viaggi.md) | pubblicazione, dettaglio, i miei viaggi, modifica, cancellazione, ricerca | #16, #17, #18 |
| [prenotazioni.md](prenotazioni.md) | richieste, annullamento, accettazione, rifiuto | #19, #20 |
| [report-valutazioni.md](report-valutazioni.md) | report PSCL, valutazioni | #21, #24 |

`GET /api/health` → `200 { "status": "ok" }` (già nel `main`).

## Convenzioni

- Base `/api`, corpo e risposte in JSON (`Content-Type: application/json`).
- **Nomi dei campi** in camelCase italiano, uguali agli attributi del class diagram quando esistono
  (`dataOraPartenza`, `postiOfferti`). Gli id sono interi.
- **Date e ore**: stringhe ISO 8601 con fuso (`2026-12-03T08:00:00+01:00`). Il frontend compone data e
  orario del modulo nel fuso `Europe/Rome`. Solo date: `AAAA-MM-GG`; solo orari: `HH:MM`.
- **Importi**: numero con al massimo due decimali (`3.5`); assente = `null`.
- **Stati** (nomi delle enumerazioni del class diagram, senza spazi): Account `InAttesaDiVerifica`,
  `Attivo`, `Eliminato`; Viaggio `Attivo`, `Cancellato`, `Concluso`; RichiestaPrenotazione `InAttesa`,
  `Accettata`, `Rifiutata`, `Annullata`, `Completata`. Le etichette per l'utente le sceglie il frontend.
- Ogni route chiama **un solo** metodo del Service del proprio sottosistema (colonna «Service»).

## Autenticazione e ruoli

- Sessione in un cookie `carpool_sessione` (httpOnly, sameSite=Lax, secure in produzione), impostato
  da `POST /api/auth/login`. Il frontend usa `fetch` con `credentials: "include"`.
- Ruoli: `Membro`, `MobilityManager` (Membro con `ruoloMobilityManager = true`), `Amministratore`.
  Dove è scritto «Membro» sono ammessi anche i Mobility Manager.
- Middleware (#13): `richiediAutenticazione` → 401 senza sessione valida; `richiediRuolo(...ruoli)` → 403.

## Errori

Formato unico, prodotto dal middleware di #10 a partire dalle classi di `backend/src/comune/errori.js`.

| Codice HTTP | Quando | Corpo |
|---|---|---|
| 400 | dati non validi (un messaggio per campo, RNF_USA_2) | `{ "errori": [{ "campo": "email", "messaggio": "…" }] }` |
| 401 | nessuna sessione valida o credenziali errate | `{ "errore": { "codice": "NON_AUTENTICATO", "messaggio": "…" } }` |
| 403 | ruolo o proprietario non ammesso | `{ "errore": { "codice": "NON_AUTORIZZATO", "messaggio": "…" } }` |
| 404 | risorsa inesistente | `{ "errore": { "codice": "NON_TROVATO", "messaggio": "…" } }` |
| 409 | operazione non ammessa nello stato attuale (regola di dominio) | `{ "errore": { "codice": "<CODICE>", "messaggio": "…" } }` |
| 500 | errore imprevisto (registrato con LogService) | `{ "errore": { "codice": "ERRORE_INTERNO", "messaggio": "Si è verificato un errore" } }` |

- I **codici 409** sono elencati negli endpoint (es. `POSTI_ESAURITI`): il frontend mostra `messaggio`.
- Classi in `comune/errori.js`: `ErroreValidazione` (400, con `errori`), `ErroreNonAutenticato` (401),
  `ErroreNonAutorizzato` (403), `ErroreNonTrovato` (404), `ErroreConflitto` (409, con `codice`).
- Gli errori imprevisti sono registrati con `codice: ERRORE_INTERNO` e `sottosistema: backend`.
  Nel log, `data` è una data ISO 8601 e `ora` è l'ora ISO 8601 in UTC.
- Un campo di un elenco si indica con l'indice: `"campo": "sedi[0].nome"`.
- I messaggi sono in italiano e dicono il campo e il formato atteso (RNF_USA_2).
