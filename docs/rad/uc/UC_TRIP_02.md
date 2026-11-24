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
| 2 | Sistema | Mostra il modulo di ricerca con i filtri obbligatori per zona di partenza, sede di destinazione, data e orario minimo di partenza. Il Passeggero può selezionare soltanto le sedi della propria organizzazione. |
| 3 | Passeggero | Inserisce i filtri e conferma la ricerca. |
| 4 | Sistema | Verifica che tutti i filtri obbligatori siano compilati, che la sede selezionata appartenga all’organizzazione del Passeggero e che la data e l’orario indicati non siano già trascorsi. Se i filtri sono validi, seleziona i viaggi nello stato «Attivo» con almeno un posto disponibile, con partenza nella zona indicata, diretti alla sede selezionata e previsti nella data indicata. Include soltanto i viaggi con orario di partenza uguale o successivo all’orario minimo inserito. Per ciascun viaggio mostra data, orario, punto di partenza, posti disponibili e contributo spese. Se il contributo non è stato indicato, mostra «Contributo non indicato». |

## Flusso alternativo: Nessun viaggio compatibile

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Il Sistema rileva che nessun viaggio soddisfa tutti i criteri del passo 4 e informa il Passeggero che non ci sono viaggi disponibili per i filtri inseriti. Il caso d’uso termina con exit condition on success. |

## Flusso di errore: Filtri non validi

| Passo | Attore | Azione |
|---|---|---|
| 4.b1 | Sistema | Se manca un filtro obbligatorio, la sede selezionata non appartiene all’organizzazione del Passeggero, la data è precedente a quella corrente oppure la data è quella corrente e l’orario è già trascorso, il Sistema non esegue la ricerca. Mostra il messaggio di errore accanto a ciascun campo non valido entro un secondo dall’invio del modulo. Per una data precedente a quella corrente, segnala l’errore sul campo data. |
| 4.b2 | Sistema | Il caso d'uso riprende dal passo 3; se il Passeggero abbandona, termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | SC_CP_08 |
| RF collegati | RF_TRIP_03 |
| Special requirements | RNF_USA_1: ricerca e invio della richiesta di prenotazione in massimo 5 interazioni. RNF_USA_2: segnalazione degli errori entro 1 secondo. RNF_PERF_3: Il Sistema presenta i risultati della ricerca entro 2 secondi dall’invio dei filtri, in presenza di almeno 500 viaggi attivi simultaneamente. |
