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

## Contrasti aperti tra i modelli

Da risolvere (decisione dei PM con gli autori dei diagrammi) **prima** dei task
L4 interessati. Finché sono aperti, il pianificatore li segnala e non sceglie.

| # | Dove | Contrasto |
|---|---|---|
| M1 | `SD_CP_02`, `CD_CP_01` (Sede) | La ricerca prende i viaggi da `Sede.getViaggiAttivi()` e li filtra nel control; l'ODD (Strategy) prevede un'unica query di PersistenzaService (DG_7, RNF_PERF_3). `Sede` (organizzazioni) che restituisce viaggi viola le dipendenze dell'SDD. |
| M2 | `SD_CP_06` | Il report conta i viaggi nel control a partire da `Sede.getViaggiConclusi()`; l'SDD assegna i conteggi a PersistenzaService (DG_1). Stessa dipendenza vietata di M1. |
| M3 | `SD_CP_05` | `ValutaPartecipanteControl` (comunita) chiama `Membro.calcolaValutazioneMedia()` (account): comunita non può usare AccountService; l'SDD assegna la media a ComunitaService. |
| M4 | `SD_CP_04` | La notifica è chiamata direttamente dal control; l'ODD prevede l'Observer dopo il commit. Il sequence non mostra la transazione unica tra controllo dei posti e `accetta()` (DG_5). |
| M5 | ODD, `CD_CP_02` | L'ODD introduce `GestoreViaggi`, `GestorePrenotazioni`, `RicercaViaggi`; modelli e TCS usano i control. Va deciso se i control restano o diventano le classi interne dell'ODD. |
| M6 | `docs/rad/uc/` | Riferimenti ai RNF non coerenti con il RAD (TCS, PA_08): UC_AUTH_01 (RNF_INT_2, RNF_REL_1), UC_TRIP_06 (RNF_REL_3), UC_TRIP_09 (RNF_REL_2), UC_TRIP_01 (RF_TRIP_01 invece di 01a/01b). Si correggono nel RAD e poi qui. |
