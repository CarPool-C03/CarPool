# UC_TRIP_02 Cercare un viaggio

<!-- Copia testuale del caso d'uso del RAD (C03-RAD-ver1.0.0, par. 3.4.2). Se cambia il RAD, si aggiorna questo file nella stessa PR. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_TRIP_02 |
| Nome | Cercare un viaggio |
| Data | 10/11/2026 |
| Versione | 1.0 |
| Autore | Vitiello Michele |
| Descrizione | Consente al Passeggero di cercare i viaggi attivi verso una sede della propria organizzazione, filtrandoli per zona di partenza, destinazione, data e orario. |
| Attore principale | Passeggero — obiettivo: Trovare un viaggio compatibile con il proprio tragitto e i propri orari. |
| Attori secondari | Nessuno |
| Entry condition | Il caso d’uso inizia quando il Passeggero, autenticato, richiede la ricerca di un viaggio. |
| Exit condition on success | Il caso d’uso termina quando il sistema ha presentato l’elenco dei viaggi attivi compatibili con i filtri, oppure ha comunicato che nessun viaggio è compatibile. |
| Exit condition on failure | Il caso d’uso termina senza alcun elenco: i filtri non sono validi e il Passeggero abbandona la ricerca. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 150/giorno |
| Extension point | – |
| Generalization of | - |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Passeggero | Richiede la ricerca di un viaggio. |
| 2 | Sistema | Richiede zona di partenza, sede di destinazione, data e orario di partenza. |
| 3 | Passeggero | Inserisce i filtri e conferma la ricerca. |
| 4 | Sistema | Verifica che i filtri obbligatori siano completi e che data e orario non siano già trascorsi; seleziona i viaggi nello stato «Attivo» con almeno un posto disponibile e compatibili con i filtri; presenta l’elenco con data, orario, punto di partenza, posti disponibili e contributo spese di ciascun viaggio. |

## Flusso alternativo: Nessun viaggio compatibile

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva che nessun viaggio attivo è compatibile con i filtri e ne informa il Passeggero; il caso d’uso termina con exit condition on success. |

## Flusso di errore: Filtri non validi

| Passo | Attore | Azione |
|---|---|---|
| 4.b1 | Sistema | Rileva filtri obbligatori mancanti oppure una data o un orario già trascorsi, non esegue la ricerca e segnala l’errore relativo a ciascun filtro. |
| 4.b2 | Sistema | Il caso d'uso riprende dal passo 3; se il Passeggero abbandona, termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | SC_CP_08 |
| RF collegati | RF_TRIP_03 |
| Special requirements | RNF_USA_1: ricerca e invio della richiesta di prenotazione in massimo 5 interazioni. RNF_USA_2: segnalazione degli errori entro 1 secondo. |
