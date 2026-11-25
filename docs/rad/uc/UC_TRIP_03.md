# UC_TRIP_03 Gestire le richieste di prenotazione

<!-- Caso d'uso del Passeggero per inviare, consultare e annullare le proprie richieste. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_TRIP_03 |
| Nome | Gestire le richieste di prenotazione |
| Data | 25/11/2026 |
| Versione | 1.0 |
| Autore | Vladyslav Maslov, Roberto Rega |
| Descrizione | Consente al Passeggero di inviare una richiesta di posto per un viaggio, consultare le proprie richieste e annullare quelle ammesse. |
| Attore principale | Passeggero — obiettivo: richiedere un posto, seguire l'esito della richiesta e poterla annullare. |
| Attori secondari | Nessuno |
| Entry condition | Il Passeggero è autenticato e consulta un viaggio o le proprie richieste. |
| Exit condition on success | La richiesta è registrata in «In attesa», le richieste sono mostrate con stato e dati del viaggio, oppure la richiesta ammessa è «Annullata». |
| Exit condition on failure | Nessuna richiesta viene creata o modificata; il Sistema informa il Passeggero del motivo. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 150/giorno |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale: inviare una richiesta

| Passo | Attore | Azione |
|---|---|---|
| 1 | Passeggero | Seleziona un viaggio e richiede un posto. |
| 2 | Sistema | Verifica che il viaggio esista, appartenga all'organizzazione del Passeggero, non sia proprio, sia «Attivo» e non abbia già una richiesta attiva dello stesso Passeggero. |
| 3 | Sistema | Registra la richiesta nello stato «In attesa» e conferma l'operazione. La richiesta è ammessa anche se i posti disponibili sono zero. |

## Flusso alternativo: consultare le proprie richieste

| Passo | Attore | Azione |
|---|---|---|
| 1.a1 | Passeggero | Richiede l'elenco delle proprie richieste. |
| 1.a2 | Sistema | Mostra tutte le proprie richieste con stato e dati del viaggio, ordinate per data di partenza decrescente. Il caso d'uso termina con exit condition on success. |

## Flusso alternativo: annullare una richiesta

| Passo | Attore | Azione |
|---|---|---|
| 1.b1 | Passeggero | Seleziona una propria richiesta «In attesa» o «Accettata» relativa a un viaggio non concluso e ne richiede l'annullamento. |
| 1.b2 | Sistema | Imposta lo stato della richiesta su «Annullata» e conferma l'operazione. Se era «Accettata», i posti disponibili aumentano di uno perché sono calcolati sulle richieste «Accettata». Il caso d'uso termina con exit condition on success. |

## Flusso di errore: viaggio non disponibile per la richiesta

| Passo | Attore | Azione |
|---|---|---|
| 2.a1 | Sistema | Se il viaggio non esiste o appartiene a un'altra organizzazione, segnala la risorsa non trovata; se è proprio o non è «Attivo», non crea la richiesta e segnala l'errore corrispondente. |
| 2.a2 | Sistema | Il caso d'uso termina con exit condition on failure. |

## Flusso di errore: richiesta attiva già presente

| Passo | Attore | Azione |
|---|---|---|
| 2.b1 | Sistema | Rileva una richiesta «In attesa» o «Accettata» dello stesso Passeggero per il viaggio, non ne crea un'altra e segnala `RICHIESTA_GIA_PRESENTE`. |
| 2.b2 | Sistema | Il caso d'uso termina con exit condition on failure. |

## Flusso di errore: annullamento non consentito

| Passo | Attore | Azione |
|---|---|---|
| 1.c1 | Sistema | Se la richiesta non appartiene al Passeggero, non la modifica e nega l'operazione; se lo stato non è «In attesa» o «Accettata», oppure il viaggio è «Concluso», non la annulla e segnala l'errore corrispondente. |
| 1.c2 | Sistema | Il caso d'uso termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | – |
| RF collegati | RF_TRIP_06, RF_TRIP_14, RF_TRIP_23a, RF_TRIP_23b |
| Special requirements | I posti disponibili sono calcolati sottraendo ai posti offerti le richieste «Accettata»; una richiesta «In attesa» non occupa un posto. |
