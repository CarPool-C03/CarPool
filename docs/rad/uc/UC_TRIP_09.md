# UC_TRIP_09 Valutare un partecipante al viaggio

<!-- Copia testuale del caso d'uso del RAD (C03-RAD-ver1.0.0, par. 3.4.2). Se cambia il RAD, si aggiorna questo file nella stessa PR. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_TRIP_09 |
| Nome | Valutare un partecipante al viaggio |
| Data | 06/11/2026 |
| Versione | 1.1 |
| Autore | Esposito Simone |
| Descrizione | Consente, per un viaggio concluso, al Conducente di valutare un Passeggero con prenotazione accettata e al Passeggero con prenotazione accettata di valutare il Conducente, con un punteggio da 1 a 5 e un commento facoltativo. |
| Attore principale | Membro — obiettivo: Rilasciare un giudizio sull’affidabilità degli altri partecipanti e contribuire alla fiducia nella comunità. |
| Attori secondari | Nessuno |
| Entry condition | Il caso d’uso inizia quando il Membro, autenticato, seleziona un viaggio e richiede di valutare un altro partecipante. |
| Exit condition on success | Il caso d’uso termina quando la valutazione è registrata e la valutazione media del partecipante valutato è aggiornata. |
| Exit condition on failure | Il caso d’uso termina senza alcuna valutazione registrata: il viaggio non è concluso, il Membro non vi ha partecipato oppure ha già valutato lo stesso partecipante per lo stesso viaggio. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 80/giorno (fase pilota) |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Membro | Seleziona un viaggio concluso e richiede di valutare un altro partecipante. |
| 2 | Sistema | Verifica che il viaggio sia concluso e che il Membro e il partecipante da valutare vi abbiano preso parte l’uno come Conducente e l’altro come Passeggero con prenotazione accettata; verifica che il Membro non abbia già valutato lo stesso partecipante per lo stesso viaggio; richiede un punteggio intero da 1 a 5 e un commento facoltativo. |
| 3 | Membro | Inserisce il punteggio e l’eventuale commento e ne conferma l’invio. |
| 4 | Sistema | Registra la valutazione, aggiorna la valutazione media del partecipante valutato e conferma l’avvenuto salvataggio. |

## Flusso alternativo: Nessuno


## Flusso di errore: Viaggio non concluso o partecipazione assente

| Passo | Attore | Azione |
|---|---|---|
| 2.a1 | Sistema | Rileva che il viaggio non è concluso oppure che il Membro e il partecipante indicato non vi hanno preso parte l’uno come Conducente e l’altro come Passeggero con prenotazione accettata, non consente la valutazione e ne informa il Membro. |
| 2.a2 | Sistema | Il caso d’uso termina con exit condition on failure. |

## Flusso di errore: Valutazione già inviata

| Passo | Attore | Azione |
|---|---|---|
| 2.b1 | Sistema | Rileva che il Membro ha già valutato lo stesso partecipante per lo stesso viaggio, non consente una nuova valutazione e ne informa il Membro. |
| 2.b2 | Sistema | Il caso d’uso termina con exit condition on failure. |

## Flusso di errore: Punteggio mancante

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva l’assenza del punteggio, non registra la valutazione e segnala l’errore. |
| 4.a2 | Sistema | Il caso d’uso riprende dal passo 3. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | SC_CP_04, SC_CP_15 |
| RF collegati | RF_TRIP_12, RF_TRIP_22, RF_TRIP_13 |
| Special requirements | RNF_REL_2: rifiuto del 100% delle valutazioni inviate da chi non ha partecipato al viaggio o relative a viaggi non conclusi. |
