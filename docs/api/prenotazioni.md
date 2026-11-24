# API: richieste di prenotazione

Convenzioni ed errori comuni: [README.md](README.md). Sottosistema: `viaggiPrenotazioni`
(ViaggioPrenotazioneService, che delega a GestorePrenotazioni). Ruoli: **Membro** per tutti.

Formato di una richiesta nelle risposte:
```json
{ "id": 12, "stato": "InAttesa",
  "viaggio": { "id": 7, "dataOraPartenza": "2026-12-03T08:00:00+01:00", "puntoPartenza": "Salerno, Piazza della Concordia",
               "sede": { "id": 1, "nome": "Campus di Fisciano" }, "stato": "Attivo",
               "conducente": { "id": 3, "nome": "Luca", "cognome": "Verdi" } } }
```

## POST /api/viaggi/:id/richieste — #19 · RF_TRIP_06
Service: `ViaggioPrenotazioneService.inviaRichiesta(membroId, viaggioId)`. Nessun corpo.
Viaggio inesistente o di un'altra organizzazione → `404`; viaggio proprio → `409` `VIAGGIO_PROPRIO`;
viaggio non `Attivo` → `409` `VIAGGIO_NON_ATTIVO`; richiesta `InAttesa` o `Accettata` già presente per
quel viaggio → `409` `RICHIESTA_GIA_PRESENTE`. Risposta `201`: la richiesta, stato `InAttesa`.

## GET /api/richieste/mie — #19 · RF_TRIP_14
Service: `ViaggioPrenotazioneService.richiesteDelPasseggero(membroId)`. Risposta `200`:
`{ "richieste": [ … ] }` (formato sopra), ordinate per `viaggio.dataOraPartenza` decrescente.

## POST /api/richieste/:id/annulla — #19 · RF_TRIP_23a, RF_TRIP_23b
Service: `ViaggioPrenotazioneService.annullaRichiesta(membroId, richiestaId)`. Nessun corpo.
Non è il passeggero → `403`; richiesta non `InAttesa` né `Accettata` → `409` `RICHIESTA_NON_ANNULLABILE`;
viaggio `Concluso` → `409` `VIAGGIO_CONCLUSO`. Il posto torna libero da solo (posti calcolati).
Risposta `200`: la richiesta, stato `Annullata`.

## POST /api/richieste/:id/accetta — #20 · UC_TRIP_06 passo 2
Service: `ViaggioPrenotazioneService.accettaRichiesta(membroId, richiestaId)` (operazione `accetta` di
RispondiRichiestaControl, svolta da GestorePrenotazioni). Nessun corpo.

Ordine (SD_CP_04 con le decisioni M4 di `docs/modelli/README.md`), tutto in `PersistenzaService.transazione`:
1. legge la richiesta e il viaggio con `SELECT … FOR UPDATE` sulla riga del viaggio;
2. non è il conducente del viaggio → `403`; richiesta non `InAttesa` → `409` `RICHIESTA_NON_IN_ATTESA`;
3. viaggio non `Attivo` → `409` `VIAGGIO_NON_ATTIVO` (UC 2.b1);
4. richieste `Accettata` ≥ `postiOfferti` → `409` `POSTI_ESAURITI` (UC 2.a1), la richiesta resta `InAttesa`;
5. altrimenti la richiesta diventa `Accettata`.

Dopo il commit: evento `RichiestaAccettata` a EventiPrenotazione → NotificaEsitoObserver →
`NotificaService.inviaEsitoPrenotazione` (entro 60 s, RNF_PERF_1). Un invio fallito non annulla
l'accettazione (errore nel log). Risposta `200`: `{ "id", "stato": "Accettata", "postiDisponibili": 1 }`.

## POST /api/richieste/:id/rifiuta — #20 · UC_TRIP_06 flusso 1.a
Service: `ViaggioPrenotazioneService.rifiutaRichiesta(membroId, richiestaId)` (operazione `rifiuta`).
Stessi controlli 2–3 di `accetta`, poi la richiesta diventa `Rifiutata`; dopo il commit evento
`RichiestaRifiutata` con la notifica di esito negativo. Risposta `200`: `{ "id", "stato": "Rifiutata" }`.

## Observer (cartella `viaggiPrenotazioni/eventi/`, ODD)

- `EventoPrenotazione`: `{ tipo, richiestaId, viaggioId }`, con `tipo` in `RichiestaAccettata`,
  `RichiestaRifiutata`.
- `EventiPrenotazione.registra(osservatore)`, `EventiPrenotazione.notifica(evento)`.
- `OsservatorePrenotazione.aggiorna(evento)`; `NotificaEsitoObserver` la implementa.
- Gli osservatori si registrano in `backend/src/server.js`; nei test si registrano a mano.
