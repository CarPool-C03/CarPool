# Requisiti del sistema

Copia testuale delle Sez. 3.2 e 3.3 del RAD (C03-RAD). Se cambia il RAD, si aggiorna
questo file nella stessa PR. Le issue citano i requisiti con questi identificativi.

## Requisiti funzionali

| ID | Nome | Descrizione | Priorità |
|---|---|---|---|
| RF_AUTH_01 | Registrazione Visitatore | Il Sistema deve consentire al Visitatore di registrarsi inserendo nome, cognome, indirizzo e-mail aziendale o istituzionale e password. | Alta |
| RF_AUTH_02 | Verifica e-mail | Il Sistema deve attivare l’account solo dopo che il Membro ha confermato l’indirizzo tramite il link inviato all’e-mail indicata in registrazione | Alta |
| RF_AUTH_03 | Login Membro | Il Sistema deve consentire al Membro l'accesso alla piattaforma quando vengono inserite e-mail e password corrette. | Alta |
| RF_AUTH_04 | Chiusura sessione Membro | Il Sistema deve terminare la sessione attiva del Membro quando viene richiesta la disconnessione | Alta |
| RF_AUTH_05 | Reindirizzamento disconnessione | Il Sistema deve mostrare la pagina iniziale quando il Membro si disconnette | Alta |
| RF_AUTH_06 | Errore login | Il Sistema deve negare l'accesso alla piattaforma quando il Membro inserisce credenziali non valide | Alta |
| RF_AUTH_07 | Eliminazione account | Il Sistema deve permettere al Membro di cancellare definitivamente il proprio profilo e i dati associati | Alta |
| RF_AUTH_08 | Inserimento Dati Veicolo | Il Sistema deve permettere al Membro di inserire modello, colore e numero di posti passeggeri del proprio veicolo all'interno del proprio profilo. | Alta |
| RF_AUTH_09 | Aggiornamento Dati Veicolo | Il Sistema deve permettere al Membro di aggiornare i dati della propria auto all'interno del proprio profilo | Bassa |
| RF_AUTH_10 | Recupero Credenziali | Il Sistema deve consentire al Membro di richiedere il recupero delle sue credenziali di accesso (via link sull’email con cui si è registrato) | Bassa |
| RF_AUTH_11 | Cancellazione Dati Veicolo | Il Sistema deve permettere all’utente di cancellare i dati inseriti riguardo la proprio auto | Bassa |
| RF_TRIP_01a | Pubblicazione Viaggio | Il Sistema deve permettere al Conducente con un veicolo associato al profilo di pubblicare un viaggio singolo verso una sede dell'organizzazione, indicando data, orario, punto di partenza e numero di posti offerti. | Alta |
| RF_TRIP_01b | Vincolo Posti Offerti | Il Sistema deve impedire al Conducente di offrire un numero di posti superiore al numero di posti passeggeri del veicolo associato al proprio profilo. | Alta |
| RF_TRIP_02 | Inserimento Costo Indicativo | Il Sistema deve permettere al Conducente di indicare facoltativamente, in fase di pubblicazione del viaggio, un contributo spese in euro per Passeggero, mostrato come informazione non vincolante. | Alta |
| RF_TRIP_03 | Ricerca Viaggio | Il Sistema deve permettere al Passeggero di cercare i viaggi attivi inserendo filtri per zona di partenza, sede di destinazione, data e orario di partenza. | Alta |
| RF_TRIP_04 | Modifica Viaggio | Il Sistema deve permettere al Conducente di modificare i dettagli di un viaggio pubblicato, a condizione che non vi siano prenotazioni nello stato Accettata. | Alta |
| RF_TRIP_05 | Cancellazione Viaggio | Il Sistema deve permettere al Conducente di cancellare un viaggio precedentemente pubblicato. | Alta |
| RF_TRIP_06 | Richiesta Prenotazione | Il Sistema deve permettere al Passeggero di inviare una richiesta di prenotazione di un posto per uno specifico viaggio. | Alta |
| RF_TRIP_07 | Accettazione Prenotazione | Il Sistema deve permettere al Conducente di accettare una richiesta di prenotazione ricevuta. | Alta |
| RF_TRIP_08 | Rifiuto Prenotazione | Il Sistema deve permettere al conducente di rifiutare una richiesta di prenotazione ricevuta. | Alta |
| RF_TRIP_09 | Notifica accettazione prenotazione | Il Sistema deve inviare una notifica e-mail di conferma al Passeggero quando il Conducente accetta una richiesta di prenotazione | Alta |
| RF_TRIP_10 | Notifica rifiuto prenotazione | Il Sistema deve inviare una notifica e-mail di esito negativo al Passeggero quando il Conducente rifiuta una richiesta di prenotazione | Alta |
| RF_TRIP_11 | Controllo posti disponibili | Il Sistema deve impedire conferme di prenotazione che eccedano il numero massimo di posti disponibili configurato per il viaggio. | Alta |
| RF_TRIP_12 | Valutazione del Passeggero | Il Sistema deve permettere al Conducente di un viaggio concluso di valutare ciascun Passeggero con prenotazione accettata, con un punteggio intero da 1 a 5 e un commento facoltativo. | Alta |
| RF_TRIP_13 | Blocco Duplicati Valutazione | Il Sistema deve impedire a un Membro di inviare più di una valutazione per lo stesso destinatario e lo stesso viaggio. | Alta |
| RF_TRIP_14 | Visualizzazione Stato Richieste | Il Sistema deve permettere al Passeggero di consultare lo stato (In attesa, Accettata, Rifiutata o Annullata) di ciascuna delle proprie richieste di prenotazione. | Alta |
| RF_TRIP_15 | Visualizzazione Feedback | Il Sistema deve permettere al Membro di consultare le valutazioni ricevute e la propria valutazione media. | Bassa |
| RF_TRIP_16 | Notifica cancellazione viaggio | Il Sistema deve inviare una notifica e-mail al Passeggero con richiesta di prenotazione nello stato In attesa o Accettata quando il Conducente cancella il viaggio. | Bassa |
| RF_TRIP_17 | Notifica nuova richiesta | Il Sistema deve inviare una notifica e-mail al Conducente quando un Passeggero invia una richiesta di prenotazione per un suo viaggio. | Bassa |
| RF_TRIP_18 | Notifica modifica viaggio | Il Sistema deve inviare una notifica e-mail, con i dati aggiornati, al Passeggero con richiesta di prenotazione nello stato In attesa quando il Conducente modifica il viaggio. | Bassa |
| RF_TRIP_19 | Pubblicazione viaggio per un evento | Il Sistema deve permettere al Conducente con un veicolo associato al profilo di pubblicare un viaggio di andata verso un evento pubblicato o di ritorno dal luogo dell’evento, indicando data, orario e punto di partenza e numero di posti offerti, non superiore ai posti del veicolo. | Media |
| RF_TRIP_20a | Ricerca viaggio per un evento | Il Sistema deve permettere al Passeggero di cercare i viaggi attivi di andata o di ritorno relativi a un evento pubblicato, filtrandoli per zona di partenza. | Media |
| RF_TRIP_20b | Visualizzazione valutazione media | Il Sistema deve mostrare, per ciascun viaggio trovato nella ricerca per evento, la valutazione media del Conducente. | Media |
| RF_TRIP_21 | Messaggistica dedicata | Il Sistema deve permettere al Conducente e al Passeggero con prenotazione accettata di scambiarsi messaggi di testo relativi a un viaggio non ancora concluso. | Media |
| RF_TRIP_22 | Valutazione del Conducente | Il Sistema deve permettere a ciascun Passeggero con prenotazione accettata su un viaggio concluso di valutare il Conducente, con un punteggio intero da 1 a 5 e un commento facoltativo. | Alta |
| RF_TRIP_23a | Annullamento prenotazione | Il Sistema deve permettere al Passeggero di annullare una propria richiesta di prenotazione nello stato In attesa o Accettata per un viaggio non ancora concluso. | Alta |
| RF_TRIP_23b | Ripristino posto disponibile | Il Sistema deve incrementare di un'unità i posti disponibili del viaggio quando un Passeggero annulla una prenotazione nello stato Accettata. | Alta |
| RF_TRIP_24 | Consultazione viaggi pubblicati | Il Sistema deve permettere al Conducente di consultare i propri viaggi pubblicati, attivi e conclusi, con le richieste di prenotazione ricevute per ciascun viaggio e il relativo stato. | Alta |
| RF_TRIP_25 | Conclusione automatica viaggio | Il Sistema deve impostare automaticamente lo stato di un viaggio Attivo su Concluso trascorse 2 ore dall'orario di partenza previsto, aggiornando contestualmente lo stato delle eventuali prenotazioni Accettate su Completata. | Media |
| RF_ORG_01 | Generazione Report PSCL | Il Sistema deve permettere al Mobility Manager di generare, per una sede e un periodo indicati, un report anonimo con il numero di viaggi condivisi, di posti offerti e di passeggeri trasportati, a supporto della redazione del PSCL. | Alta |
| RF_ORG_02 | Esportazione Report PSCL | Il Sistema deve permettere al Mobility Manager di esportare in un file il report generato. | Bassa |
| RF_ORG_03 | Pubblicazione evento | Il Sistema deve permettere ad un Membro di un’organizzazione partner, di pubblicare un evento indicando nome, data, orario di inizio e luogo, rendendolo disponibile come destinazione dei viaggi. | Media |
| RF_ADM_01 | Registrazione organizzazione partner | Il Sistema deve permettere all’Amministratore di registrare un’organizzazione partner indicando denominazione, sedi e domini e-mail autorizzati alla registrazione. | Alta |
| RF_ADM_02 | Modifica organizzazione partner | Il Sistema deve permettere all’Amministratore di modificare denominazione, sedi e domini e-mail autorizzati di un’organizzazione partner. | Bassa |
| RF_ADM_03 | Disattivazione organizzazione partner | Il Sistema deve permettere all’Amministratore di disattivare un’organizzazione partner, rifiutando da quel momento le nuove registrazioni con i suoi domini e-mail. | Bassa |
| RF_ADM_04 | Assegnazione ruolo Mobility Manager | Il Sistema deve permettere all’Amministratore di assegnare il ruolo di Mobility Manager a un Membro con account attivo di un’organizzazione partner. | Alta |
| RF_ADM_05 | Login amministratore | Il Sistema deve consentire all’amministratore l'accesso alla piattaforma quando vengono inserite e-mail e password corrette. | Media |

## Requisiti non funzionali

- **RNF_USA_1**: Il Sistema deve permettere a un Passeggero di completare la ricerca e l'invio di una richiesta di prenotazione in un massimo di 5 interazioni (click) a partire dalla schermata principale.
- **RNF_USA_2**: Il Sistema deve mostrare, accanto a ogni campo non valido, un messaggio che indica il campo e il formato atteso, entro 1 secondo dall'invio del modulo.
- **RNF_USA_3**: Il Sistema deve consentire a un utente al primo utilizzo di completare la pubblicazione di un nuovo viaggio in meno di 2 minuti dall'accesso alla schermata dedicata.
- **RNF_REL_1**: Il Sistema deve garantire una disponibilità del servizio almeno pari al 99% nella fascia oraria compresa tra le 06:00 e le 22:00.
- **RNF_REL_2**: Il Sistema deve garantire un tempo medio tra i guasti (MTBF) superiore a 720 ore di funzionamento continuo.
- **RNF_REL_3**: Il Sistema deve ripristinare la normale operatività in meno di 15 minuti in caso di interruzione imprevista del servizio.
- **RNF_PERF_1**: Il Sistema deve inoltrare al provider e-mail esterno la richiesta di invio della notifica di conferma della prenotazione entro 60 secondi dall'accettazione da parte del Conducente.
- **RNF_PERF_2**: Il Sistema deve completare il processo di generazione ed esportazione delle statistiche aggregate di 12 mesi relative a una sede in meno di 10 secondi.
- **RNF_PERF_3**: Il Sistema deve presentare i risultati di una ricerca di viaggi entro 2 secondi dall'invio dei filtri, in presenza di almeno 500 viaggi attivi simultaneamente.
- **RNF_SUP_1**: Il Sistema deve registrare in un file di log dedicato ogni errore applicativo e fallimento di invio delle e-mail di notifica, riportando data, ora e codice identificativo dell'errore.
- **RNF_SUP_2**: Il Sistema deve permettere all'amministratore di sistema di aggiornare l'elenco dei domini aziendali autorizzati senza richiedere modifiche al codice sorgente o l'interruzione del servizio.
- **RNF_IMP_01**: Il Sistema deve gestire i rimborsi esclusivamente come informazione testuale.
- **RNF_INT_1**: Il Sistema deve interfacciarsi tramite API con un provider esterno di posta elettronica per gestire l'invio automatizzato delle notifiche di sistema e dei link di verifica account.
- **RNF_LEG_01**: Il Sistema deve generare report e statistiche per il Mobility Manager contenenti esclusivamente dati aggregati e anonimi, privi di qualsiasi informazione identificativa del singolo Membro (0% di dati personali), in conformità al Regolamento (UE) 2016/679 (GDPR).
- **RNF_LEG_2**: Il Sistema deve terminare automaticamente la sessione di un utente autenticato dopo 30 minuti consecutivi di inattività.
- **RNF_LEG_3**: Il Sistema deve memorizzare le credenziali di accesso degli utenti esclusivamente in forma cifrata non reversibile, impedendone la lettura o il recupero in chiaro.
