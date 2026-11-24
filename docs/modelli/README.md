# Modelli di analisi (specifica per gli agenti)

I modelli del RAD sono tenuti qui in formato **testuale** (PlantUML), versionati
con il codice: un agente li legge senza ambiguità, le modifiche si vedono nelle
diff e un task può citare esattamente il file da leggere. Da un'immagine un
agente può leggere male un nome, una molteplicità o il verso di una freccia
senza segnalarlo. Gli identificativi sono quelli del RAD.

## Class diagram

| File | Contenuto | Usato per |
|---|---|---|
| `CD_CP_01_Entity.puml` | Entity: attributi, tipi, vincoli (es. postiOfferti ≥ 1), operazioni, associazioni e molteplicità | Nomi del dominio e operazioni delle entity (lo schema del database è in `docs/sdd/CD_persistenza.puml`) |
| `CD_CP_02_Boundary_Control.puml` | Boundary e control con le operazioni ricevute nei sequence; dipendenze dei control | Firme dei metodi di route e control |

## Sequence diagram

| File | Caso d'uso | Control |
|---|---|---|
| `SD_CP_01_Registrare_account.puml` | UC_AUTH_01 Registrare un account | RegistraAccountControl |
| `SD_CP_02_Cercare_viaggio.puml` | UC_TRIP_02 Cercare un viaggio | CercaViaggioControl |
| `SD_CP_03_Pubblicare_viaggio.puml` | UC_TRIP_01 Pubblicare un viaggio | PubblicaViaggioControl |
| `SD_CP_04_Rispondere_richiesta_prenotazione.puml` | UC_TRIP_06 Rispondere a una richiesta di prenotazione | RispondiRichiestaControl |
| `SD_CP_05_Valutare_partecipante.puml` | UC_TRIP_09 Valutare un partecipante al viaggio | ValutaPartecipanteControl |
| `SD_CP_06_Generare_report_PSCL.puml` | UC_ORG_01 Generare un report PSCL | GeneraReportControl |

Il sequence fissa chi chiama chi e in che ordine (per esempio: il controllo dei
posti avviene prima di `accetta()`). Per un caso d'uso senza sequence diagram
l'ordine delle chiamate va scritto nel piano, approvato dallo sviluppatore
assegnato e controllato dal PM in review.

## Statechart

| File | Entità | Stati |
|---|---|---|
| `SCD_CP_01_Ciclo_vita_Account.puml` | Account | In attesa di verifica, Attivo, Eliminato |
| `SCD_CP_02_Ciclo_vita_RichiestaPrenotazione.puml` | RichiestaPrenotazione | In attesa, Accettata, Completata, Rifiutata, Annullata |
| `SCD_CP_03_Ciclo_vita_Viaggio.puml` | Viaggio | Attivo, Cancellato, Concluso |

Stati, transizioni e guardie vanno rispettati nel codice: sono anche gli stati
usati negli oracoli del TCS (`docs/test/`).

## Regole

- I file si citano nella sezione «Specifica» del task: solo quelli necessari e,
  per il class diagram, solo le classi rilevanti.
- La conversione da uno strumento grafico si può chiedere a un agente, ma **va
  controllata da una persona** (l'autore del diagramma).
- Se l'implementazione richiede di cambiare un modello, la modifica va **nella
  stessa PR**, è dichiarata nel template della PR e si riporta anche nel RAD.
- Prima dei task di un caso d'uso (L4), l'agente `controllo-modelli` confronta
  caso d'uso (`docs/rad/uc/`), sequence, class diagram, statechart, SDD
  (`docs/sdd/`), ODD (`docs/odd/`) e category partition (`docs/test/`).
- Il class diagram di analisi (qui) fissa i nomi del dominio; lo schema del
  database segue il class diagram ristrutturato dell'SDD (`docs/sdd/CD_persistenza.puml`).

## Contrasti tra i modelli e decisioni

Le decisioni dei PM valgono per il codice e per i test; i diagrammi si correggono nel RAD/SDD
alla prossima revisione. Il pianificatore segue la decisione e **non** segnala più i contrasti
risolti; segnala solo quelli ancora aperti.

| # | Dove | Contrasto | Decisione |
|---|---|---|---|
| M1 | `SD_CP_02`, `CD_CP_01` (Sede) | La ricerca prende i viaggi da `Sede.getViaggiAttivi()` e li filtra nel control. | **Risolto**: vale l'ODD (Strategy): `RicercaViaggi` fa eseguire un'unica query a PersistenzaService. `SD_CP_02` vale solo per i controlli sui filtri. |
| M2 | `SD_CP_06` | Il report conta i viaggi nel control da `Sede.getViaggiConclusi()`. | **Risolto**: conteggi con query aggregate in PersistenzaService (SDD, DG_1). `SD_CP_06` vale per l'ordine: modulo, validazione del periodo, report. |
| M3 | `SD_CP_05` | La media è calcolata da `Membro.calcolaValutazioneMedia()` (account). | **Risolto**: la media la calcola ComunitaService tramite PersistenzaService; la partecipazione la verifica `ViaggioPrenotazioneService.verificaPartecipazione`. |
| M4 | `SD_CP_04` | Notifica chiamata direttamente dal control; transazione non mostrata. | **Risolto**: controllo dei posti e accettazione in `PersistenzaService.transazione` (DG_5); notifica tramite Observer **dopo il commit** (ODD). |
| M5 | ODD, `CD_CP_02` | Control dei modelli o classi interne dell'ODD. | **Risolto**: le classi interne sono quelle dell'ODD (`GestoreViaggi`, `GestorePrenotazioni`, `RicercaViaggi`), che svolgono le operazioni dei control di `CD_CP_02` con lo stesso ordine dei sequence. I control di account, comunita e reportistica restano con il nome di `CD_CP_02`. |
| M6 | `docs/rad/uc/` | Riferimenti ai RNF non coerenti con il RAD (UC_AUTH_01, UC_TRIP_06, UC_TRIP_09, UC_TRIP_01). | **Aperto**, solo documentale: non blocca il codice. I testi dei requisiti sono in `docs/rad/requisiti.md`. |
| M7 | `UC_TRIP_09`, `cp_UC_TRIP_09`, `cp_UC_ORG_01` | Parlano di prenotazione «Accettata» su viaggi conclusi, ma alla conclusione le richieste Accettate diventano «Completata» (`SCD_CP_02`, RF_TRIP_25). | **Risolto**: su un viaggio `Concluso` si considerano le richieste `Completata`; nei test «accettata» su un viaggio concluso si prepara come `Completata`. |
| M8 | `SCD_CP_02`, `SCD_CP_03` | Alla conclusione del viaggio le richieste `InAttesa` non hanno una transizione. | **Aperto**: per ora restano `InAttesa`; da decidere nel RAD. |
