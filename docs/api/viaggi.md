# API: viaggi e ricerca

Convenzioni ed errori comuni: [README.md](README.md). Sottosistema: `viaggiPrenotazioni`
(ViaggioPrenotazioneService, che delega a GestoreViaggi e RicercaViaggi). Ruoli: **Membro** per tutti.

Formato di un viaggio nelle risposte:
```json
{ "id": 7, "dataOraPartenza": "2026-12-03T08:00:00+01:00", "puntoPartenza": "Salerno, Piazza della Concordia",
  "sede": { "id": 1, "nome": "Campus di Fisciano" }, "postiOfferti": 3, "postiDisponibili": 2,
  "contributoIndicativoEuro": 3.5, "stato": "Attivo",
  "conducente": { "id": 3, "nome": "Luca", "cognome": "Verdi" } }
```
`contributoIndicativoEuro` è `null` se non indicato (il frontend mostra «Contributo non indicato»).

## GET /api/viaggi/pubblicazione — #16 · UC_TRIP_01 passo 2
Service: `ViaggioPrenotazioneService.avviaPubblicazione(membroId)` (operazione `avviaPubblicazione` di
PubblicaViaggioControl, svolta da GestoreViaggi). Nessun veicolo → `409` `VEICOLO_ASSENTE` (UC 2.a1:
il frontend non mostra il modulo). Risposta `200`: `{ "postiMassimi": 4, "sedi": [{ "id", "nome" }] }`.

## POST /api/viaggi — #16 · UC_TRIP_01 passo 4
Service: `ViaggioPrenotazioneService.pubblicaViaggio(membroId, dati)` (operazione `pubblica`).

Corpo: `{ "dataOraPartenza", "puntoPartenza", "sedeId", "postiOfferti", "contributoIndicativoEuro" }`

| Campo | Regola | Errore 400 sul campo |
|---|---|---|
| `dataOraPartenza` | obbligatoria, ISO 8601, **successiva** al momento corrente | mancante o non successiva (UC 4.a1) |
| `puntoPartenza` | obbligatorio, 1–200 caratteri | mancante |
| `sedeId` | obbligatoria, sede dell'organizzazione del Conducente | mancante o di un'altra organizzazione |
| `postiOfferti` | intero da 1 al `numeroPostiPasseggeri` del veicolo | zero o oltre il veicolo (RF_TRIP_01b) |
| `contributoIndicativoEuro` | facoltativo, numero ≥ 0 con al massimo 2 decimali | negativo o non numerico |

Nessun veicolo → `409` `VEICOLO_ASSENTE`. Risposta `201`: il viaggio creato, stato `Attivo`.

## GET /api/viaggi/:id — #16
Service: `ViaggioPrenotazioneService.dettaglioViaggio(viaggioId, membroId)`. Visibile ai membri della
stessa organizzazione del conducente (altrimenti `404`). Risposta `200`: il viaggio.

## GET /api/viaggi/ricerca — #17 · UC_TRIP_02
Service: `ViaggioPrenotazioneService.cercaViaggi(criterio, membroId, organizzazioneId)`, con
`criterio` = `new RicercaPerSede(filtri)`. Il router ricava `membroId` e `organizzazioneId` dal
contesto di autenticazione lato server, non dai parametri pubblici della richiesta, e li passa alla
Facade. La Facade verifica la sede con `OrganizzazioneService.sediOrganizzazione(organizzazioneId)`
prima di delegare a `RicercaViaggi`; quest'ultimo passa `filtro` e `membroId` all'operazione proposta
`PersistenzaService.cercaViaggi(filtro, membroId)` per escludere i viaggi in cui quel membro è conducente.

Parametri: `zona`, `sedeId`, `data` (`AAAA-MM-GG`), `orarioMinimo` (`HH:MM`), tutti obbligatori.
Errori 400 sul parametro: mancante (UC 4.b1); `sedeId` di un'altra organizzazione; `data` precedente
a oggi (errore su `data`); `data` uguale a oggi e `orarioMinimo` già passato (errore su `orarioMinimo`).
Data e orario si interpretano nel fuso `Europe/Rome`.

Selezione: viaggi `Attivo` verso `sedeId`, nella `data` indicata, con partenza ≥ `orarioMinimo` e nel
futuro, almeno 1 posto disponibile, conducente diverso dal Passeggero, `puntoPartenza` che contiene
`zona` senza distinguere maiuscole e minuscole. La persistenza calcola i posti disponibili sottraendo
le richieste `Accettata` ai posti offerti. Ordinati per `dataOraPartenza`.
Risposta `200`: `{ "viaggi": [ … ] }` (formato sopra); elenco vuoto → il frontend mostra
«Nessun viaggio disponibile per i filtri inseriti» (UC 4.a1).

## GET /api/viaggi/miei — #18 · RF_TRIP_24
Service: `ViaggioPrenotazioneService.viaggiDelConducente(membroId)`. Risposta `200`:
`{ "attivi": [ … ], "conclusi": [ … ] }`; ogni viaggio ha in più
`"richieste": [{ "id", "stato", "passeggero": { "id", "nome", "cognome" } }]`.
I viaggi `Cancellato` non compaiono.

## PUT /api/viaggi/:id — #18 · RF_TRIP_04
Service: `ViaggioPrenotazioneService.modificaViaggio(membroId, viaggioId, dati)`.
Corpo e validazione come `POST /api/viaggi`. Non è il conducente → `403`; viaggio non `Attivo` →
`409` `VIAGGIO_NON_ATTIVO`; richieste `Accettata` presenti → `409` `VIAGGIO_CON_PRENOTAZIONI_ACCETTATE`.
Risposta `200`: il viaggio aggiornato. Dopo il commit, `GestoreViaggi` pubblica `ViaggioModificato`
per ciascuna richiesta `InAttesa`; `NotificaModificaObserver` inoltra RF_TRIP_18 con i dati aggiornati.
Un invio fallito non annulla la modifica ed è registrato con LogService.

## DELETE /api/viaggi/:id — #18 · RF_TRIP_05
Service: `ViaggioPrenotazioneService.cancellaViaggio(membroId, viaggioId)`. Non è il conducente →
`403`; viaggio non `Attivo` → `409` `VIAGGIO_NON_ATTIVO`. In un'unica transazione: viaggio `Cancellato`,
richieste `InAttesa` e `Accettata` → `Annullata`. Dopo il commit, `GestoreViaggi` pubblica un evento
`ViaggioCancellato` per ciascuna richiesta annullata; `NotificaCancellazioneObserver` inoltra la notifica
RF_TRIP_16 al Passeggero. Un invio fallito non annulla la cancellazione ed è registrato con LogService.
Risposta `204`.

## Funzioni per altri sottosistemi e per l'attività pianificata (non sono endpoint)

- `ViaggioPrenotazioneService.concludiViaggiScaduti(adesso)` — #22: viaggi `Attivo` partiti da più di
  2 ore → `Concluso`, loro richieste `Accettata` → `Completata`, in una transazione. Restituisce il numero
  di viaggi conclusi.
- `ViaggioPrenotazioneService.verificaPartecipazione(viaggioId, autoreId, valutatoId)` — #24: `true` se
  uno è il conducente del viaggio e l'altro un passeggero con richiesta `Completata`.
