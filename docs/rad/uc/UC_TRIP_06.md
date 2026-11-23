# UC_TRIP_06 Rispondere a una richiesta di prenotazione

<!-- Copia testuale del caso d'uso del RAD (C03-RAD-ver1.0.0, par. 3.4.2). Se cambia il RAD, si aggiorna questo file nella stessa PR. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_TRIP_06 |
| Nome | Rispondere a una richiesta di prenotazione |
| Data | 06/11/2026 |
| Versione | 2.0 |
| Autore | Garone Gennaro |
| Descrizione | Consente al Conducente di accettare, nel limite dei posti offerti, oppure di rifiutare una richiesta di prenotazione ricevuta per un proprio viaggio, e di notificare l’esito al Passeggero. |
| Attore principale | Conducente — obiettivo: Decidere quali passeggeri far salire sul proprio viaggio. |
| Attori secondari | «system» Servizio E-mail — obiettivo: Recapitare al Passeggero la notifica dell’esito. |
| Entry condition | Il caso d’uso inizia quando il Conducente, autenticato, consulta le richieste nello stato «In attesa» relative a un proprio viaggio . |
| Exit condition on success | Il caso d’uso termina quando la richiesta si trova nello stato «Accettata», con i posti disponibili del viaggio diminuiti di uno, oppure nello stato «Rifiutata», e la notifica dell’esito al Passeggero è stata inoltrata al Servizio E-mail. |
| Exit condition on failure | Il caso d’uso termina con la richiesta nello stato «In attesa»: il viaggio non è più attivo oppure, in caso di accettazione, non dispone di posti disponibili. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 65/giorno |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Conducente | Seleziona una richiesta nello stato «In attesa» e ne richiede l’accettazione. |
| 2 | Sistema | Verifica che il viaggio sia nello stato «Attivo» e che il numero di prenotazioni accettate sia inferiore al numero di posti offerti; imposta lo stato della richiesta su «Accettata», per cui i posti disponibili del viaggio risultano diminuiti di uno, ed esclude il viaggio dai risultati di ricerca se i posti disponibili diventano zero; richiede al Servizio E-mail l’invio della notifica di conferma al Passeggero. |
| 3 | Servizio E-mail | Recapita la notifica di conferma al Passeggero. |
| 4 | Sistema | Conferma al Conducente l’avvenuta accettazione. |

## Flusso alternativo: Rifiuto della richiesta

| Passo | Attore | Azione |
|---|---|---|
| 1.a1 | Conducente | Richiede il rifiuto della richiesta selezionata al passo 1, anziché la sua accettazione. |
| 1.a2 | Sistema | Verifica che il viaggio sia nello stato «Attivo»; imposta lo stato della richiesta su «Rifiutata»; richiede al Servizio E-mail l’invio della notifica di esito negativo al Passeggero. |
| 1.a3 | Servizio E-mail | Recapita la notifica di esito negativo al Passeggero. |
| 1.a4 | Sistema | Conferma al Conducente l’avvenuto rifiuto; il caso d’uso termina con exit condition on success. |

## Flusso di errore: Posti esauriti

| Passo | Attore | Azione |
|---|---|---|
| 2.a1 | Sistema | Rileva che i posti offerti sono già tutti occupati, non accetta la richiesta, la lascia nello stato «In attesa» e informa il Conducente dell’esaurimento dei posti. |
| 2.a2 | Sistema | Il caso d’uso termina con exit condition on failure. |

## Flusso di errore: Viaggio non più attivo

| Passo | Attore | Azione |
|---|---|---|
| 2.b1 | Sistema | Al passo 2 o al passo 1.a2, rileva che il viaggio è stato cancellato o è concluso, non modifica la richiesta e ne informa il Conducente. |
| 2.b2 | Sistema | Il caso d’uso termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | SC_CP_06, SC_CP_10, SC_CP_11 |
| RF collegati | RF_TRIP_07, RF_TRIP_08, RF_TRIP_09, RF_TRIP_10, RF_TRIP_11 |
| Special requirements | RNF_PERF_1: notifica dell’esito inoltrata entro 60 secondi. RNF_REL_3: prenotazioni accettate mai superiori ai posti offerti. |
