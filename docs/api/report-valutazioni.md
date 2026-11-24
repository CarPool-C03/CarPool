# API: report PSCL e valutazioni

Convenzioni ed errori comuni: [README.md](README.md).

## GET /api/report — #21 · UC_ORG_01
Sottosistema `reportistica`. Ruoli: **MobilityManager**. Service:
`ReportService.generaReport(membroId, sedeId, dal, al)` (GeneraReportControl.generaReport); i conteggi
li fa PersistenzaService con query aggregate (decisione M2, DG_1).

Parametri: `sedeId`, `dal`, `al` (`AAAA-MM-GG`, inclusi), tutti obbligatori.

| Controllo | Errore |
|---|---|
| parametro mancante o data non valida | 400 sul parametro |
| `dal` non precedente ad `al` (stessa data compresa, UC 4.b1) | 400 su `dal` |
| `al` successivo alla data corrente | 400 su `al` |
| periodo più lungo di 12 mesi (DG_9) | 400 su `al` |
| sede di un'altra organizzazione | 403 |

Conteggi sui viaggi `Concluso` verso la sede con `dataOraPartenza` nel periodo (fuso `Europe/Rome`):
`viaggiCondivisi` = numero di viaggi, `postiOfferti` = somma dei posti offerti, `passeggeriTrasportati`
= numero di richieste `Completata` (decisione M7). Risposta `200`, **senza** nomi, e-mail o id di
persone (RNF_LEG_01):
```json
{ "sede": { "id": 1, "nome": "Campus di Fisciano" }, "dal": "2026-10-01", "al": "2026-10-31",
  "totali": { "viaggiCondivisi": 3, "postiOfferti": 9, "passeggeriTrasportati": 3 },
  "mesi": [{ "mese": "2026-10", "viaggiCondivisi": 3, "postiOfferti": 9, "passeggeriTrasportati": 3 }],
  "avviso": null }
```
Nessun viaggio nel periodo → totali a zero, `mesi` vuoto e `avviso` =
«Nel periodo non risultano viaggi condivisi per la sede indicata» (UC 4.a1).

## POST /api/viaggi/:id/valutazioni — #24 · UC_TRIP_09
Sottosistema `valutazioniMessaggi`. Ruoli: **Membro**. Service:
`ComunitaService.registraValutazione(autoreId, viaggioId, dati)` (ValutaPartecipanteControl). La
partecipazione la verifica `ViaggioPrenotazioneService.verificaPartecipazione` (decisioni M3, M7).

Corpo: `{ "valutatoId", "punteggio", "commento" }`

Ordine dei controlli (SD_CP_05):
1. viaggio inesistente → `404`; viaggio non `Concluso` → `409` `VIAGGIO_NON_CONCLUSO` (UC 2.a1);
2. autore e valutato non sono conducente e passeggero con richiesta `Completata` →
   `403` `NON_PARTECIPANTE` (UC 2.a1);
3. valutazione già presente per autore, valutato e viaggio → `409` `VALUTAZIONE_GIA_INVIATA` (UC 2.b1);
4. `punteggio` mancante → 400 su `punteggio` (UC 4.a1); non intero tra 1 e 5 → 400 su `punteggio`;
   `commento` oltre 500 caratteri → 400 su `commento`.

Risposta `201`: `{ "id", "punteggio", "commento", "mediaValutato": 4.33 }` (media del valutato, due
decimali).

## GET /api/valutazioni/da-fare — #24
Ruoli: **Membro**. Service: `ComunitaService.valutazioniDaFare(membroId)`: per i viaggi `Concluso` a cui
il Membro ha partecipato, le persone che non ha ancora valutato. Risposta `200`:
```json
{ "daFare": [{ "viaggio": { "id": 2, "dataOraPartenza": "…", "sede": { "id": 1, "nome": "Campus di Fisciano" } },
               "persone": [{ "membroId": 5, "nome": "Anna", "cognome": "Bianchi", "ruolo": "Passeggero" }] }] }
```
`ruolo` è il ruolo della persona da valutare in quel viaggio: `Conducente` o `Passeggero`.
