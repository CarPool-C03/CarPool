# UC_TRIP_01 Pubblicare un viaggio

<!-- Copia testuale del caso d'uso del RAD (C03-RAD-ver1.0.0, par. 3.4.2). Se cambia il RAD, si aggiorna questo file nella stessa PR. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_TRIP_01 |
| Nome | Pubblicare un viaggio |
| Data | 02/11/2026 |
| Versione | 1.0 |
| Autore | Rega Roberto |
| Descrizione | Consente al Conducente di pubblicare un viaggio singolo verso una sede della propria organizzazione, indicando data, orario, punto di partenza, posti offerti ed eventuale contributo spese indicativo. |
| Attore principale | Conducente — obiettivo: Offrire un passaggio ad altri membri dell'organizzazione e condividere il tragitto e le relative spese. |
| Attori secondari | Nessuno |
| Entry condition | Il caso d’uso inizia quando il Conducente, autenticato, richiede la pubblicazione di un nuovo viaggio. |
| Exit condition on success | Il caso d’uso termina quando il viaggio è registrato nello stato «Attivo» e risulta disponibile alla ricerca. |
| Exit condition on failure | Il caso d’uso termina senza alcun viaggio pubblicato: il Conducente non ha un veicolo registrato oppure i dati non sono validi e il Conducente abbandona la pubblicazione. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 20/giorno |
| Extension point | – |
| Generalization of | - |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Conducente | Richiede la pubblicazione di un nuovo viaggio. |
| 2 | Sistema | Verifica che al profilo del Conducente sia associato un veicolo; richiede data, orario di partenza, punto di partenza, sede di destinazione, numero di posti offerti e, facoltativamente, il contributo spese indicativo in euro |
| 3 | Conducente | Inserisce i dati del viaggio e ne conferma la pubblicazione. |
| 4 | Sistema | Verifica che i dati obbligatori siano completi, che data e orario siano successivi al momento corrente e che i posti offerti non superino i posti del veicolo registrato; registra il viaggio nello stato «Attivo», lo rende disponibile alla ricerca e conferma l’avvenuta pubblicazione |

## Flusso alternativo: Nessuno


## Flusso di errore: Dati inseriti non validi o mancanti

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva dati obbligatori mancanti, una data o un orario già trascorsi oppure un numero di posti superiore a quello del veicolo, non registra il viaggio e segnala l’errore relativo a ciascun dato. |
| 4.a2 | Sistema | Il caso d'uso riprende dal passo 3; se il Conducente abbandona, termina con exit condition on failure. |

## Flusso di errore: Veicolo non registrato

| Passo | Attore | Azione |
|---|---|---|
| 2.a1 | Sistema | Rileva che al profilo non è associato alcun veicolo e informa il Conducente che deve prima inserire i dati del veicolo |
| 2.a2 | Sistema | Il caso d’uso termina con exit condition on failure |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | SC_CP_02 |
| RF collegati | RF_TRIP_01, RF_TRIP_02 |
| Special requirements | RNF_USA_3: pubblicazione completata da un utente al primo utilizzo in meno di 2 minuti. RNF_USA_2: segnalazione degli errori entro 1 secondo. |
