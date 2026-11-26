# UC_TRIP_04 Gestire i propri viaggi pubblicati

| Campo | Valore |
|---|---|
| Identificativo | UC_TRIP_04 |
| Nome | Gestire i propri viaggi pubblicati |
| Data | 26/11/2026 |
| Versione | 1.0 |
| Autori | Michele Vitiello, Gennaro Garone |
| Descrizione | Consente al Conducente di consultare i viaggi pubblicati e le richieste ricevute, modificare un viaggio attivo senza prenotazioni accettate e cancellare un viaggio attivo. |
| Attore principale | Conducente — obiettivo: controllare e gestire i propri viaggi pubblicati. |
| Attori secondari | «system» Servizio E-mail — obiettivo: recapitare ai Passeggeri le notifiche previste per modifica e cancellazione. |
| Entry condition | Il Conducente è autenticato e richiede i propri viaggi oppure seleziona un viaggio pubblicato. |
| Exit condition on success | I viaggi e le richieste sono consultati; oppure i dettagli sono aggiornati; oppure il viaggio è «Cancellato» e le richieste «In attesa» e «Accettata» sono «Annullata». Le notifiche previste sono inoltrate al Servizio E-mail dopo il salvataggio o il commit. |
| Exit condition on failure | Nessuna modifica al viaggio o alle richieste: il Conducente non è autorizzato, il viaggio non è «Attivo», sono presenti richieste «Accettata» oppure i dati non sono validi. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 40/giorno (stima provvisoria) |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale: consultare i propri viaggi

| Passo | Attore | Azione |
|---|---|---|
| 1 | Conducente | Richiede l'elenco dei propri viaggi pubblicati. |
| 2 | Sistema | Recupera i viaggi di cui il Conducente è proprietario, esclusi quelli «Cancellato», con le richieste ricevute, il Passeggero e lo stato di ciascuna richiesta. |
| 3 | Sistema | Presenta separatamente i viaggi «Attivo» e «Concluso», ordinando gli attivi per data di partenza crescente e i conclusi per data di partenza decrescente. Per ogni viaggio mostra tragitto, data, posti disponibili e numero di richieste «In attesa». |

## Flusso alternativo: modificare un viaggio

| Passo | Attore | Azione |
|---|---|---|
| 1.a1 | Conducente | Seleziona un proprio viaggio «Attivo» e richiede di modificarne i dettagli. |
| 1.a2 | Sistema | Verifica che il viaggio sia «Attivo» e che non abbia richieste «Accettata»; mostra i dettagli e richiede i dati aggiornati. |
| 1.a3 | Conducente | Inserisce e conferma i dati aggiornati. |
| 1.a4 | Sistema | Valida i dati con le stesse regole della pubblicazione; salva i dettagli. Dopo il salvataggio, inoltra al Servizio E-mail la notifica RF_TRIP_18 con i dati aggiornati per i Passeggeri con richiesta «InAttesa». Il caso d'uso termina con exit condition on success. |

## Flusso alternativo: cancellare un viaggio

| Passo | Attore | Azione |
|---|---|---|
| 1.b1 | Conducente | Seleziona un proprio viaggio «Attivo» e ne richiede la cancellazione. |
| 1.b2 | Sistema | In un'unica transazione, imposta il viaggio su «Cancellato» e le richieste «InAttesa» e «Accettata» su «Annullata». Dopo il commit, inoltra al Servizio E-mail la notifica RF_TRIP_16 ai Passeggeri interessati. Il caso d'uso termina con exit condition on success. |

## Flusso alternativo: nessun viaggio pubblicato

| Passo | Attore | Azione |
|---|---|---|
| 2.a1 | Sistema | Non trova viaggi «Attivo» o «Concluso» del Conducente e presenta gli elenchi vuoti. Il caso d'uso termina con exit condition on success. |

## Flusso di errore: viaggio non trovato o non di proprietà del Conducente

| Passo | Attore | Azione |
|---|---|---|
| 1.c1 | Sistema | Se il viaggio non esiste, non lo modifica e segnala `NON_TROVATO` (404). Se appartiene a un altro Membro, non lo modifica e nega l'operazione (403 `NON_AUTORIZZATO`). |
| 1.c2 | Sistema | Il caso d'uso termina con exit condition on failure. |

## Flusso di errore: viaggio non attivo

| Passo | Attore | Azione |
|---|---|---|
| 1.d1 | Sistema | Rileva che il viaggio da modificare o cancellare non è «Attivo», non lo modifica e segnala `VIAGGIO_NON_ATTIVO` (409). |
| 1.d2 | Sistema | Il caso d'uso termina con exit condition on failure. |

## Flusso di errore: richieste accettate presenti

| Passo | Attore | Azione |
|---|---|---|
| 1.e1 | Sistema | Rileva una o più richieste «Accettata» durante la modifica, non modifica il viaggio e segnala `VIAGGIO_CON_PRENOTAZIONI_ACCETTATE` (409). |
| 1.e2 | Sistema | Il caso d'uso termina con exit condition on failure. |

## Flusso di errore: dati di modifica non validi

| Passo | Attore | Azione |
|---|---|---|
| 1.f1 | Sistema | Rileva dati mancanti o non validi, non salva i dettagli e segnala l'errore relativo a ciascun campo. |
| 1.f2 | Sistema | Il caso d'uso riprende dal passo 1.a3; se il Conducente abbandona, termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | – |
| RF collegati | RF_TRIP_04, RF_TRIP_05, RF_TRIP_16, RF_TRIP_18, RF_TRIP_24 |
| Special requirements | La modifica richiede viaggio «Attivo» senza richieste «Accettata» (SCD_CP_03). La cancellazione annulla le richieste «InAttesa» e «Accettata» nella stessa transazione (SCD_CP_02, SCD_CP_03). Le notifiche RF_TRIP_16 e RF_TRIP_18 sono inoltrate dopo il commit/salvataggio; un errore d'invio non annulla l'operazione (ODD). |
