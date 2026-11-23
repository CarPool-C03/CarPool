# Modelli di analisi (specifica per gli agenti)

I modelli del RAD sono tenuti qui in formato **testuale** (PlantUML), versionati
con il codice: un agente li legge senza ambiguità, le modifiche si vedono nelle
diff e un task può citare esattamente il file da leggere. Da un'immagine un
agente può leggere male un nome, una molteplicità o il verso di una freccia
senza segnalarlo. Gli identificativi sono quelli del RAD.

## Class diagram

| File | Contenuto | Usato per |
|---|---|---|
| `CD_CP_01_Entity.puml` | Entity: attributi, tipi, vincoli (es. postiOfferti ≥ 1), operazioni, associazioni e molteplicità | Classi del model, schema del database, nomi |
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
l'ordine delle chiamate va scritto nel piano e approvato dal TM responsabile
prima dell'implementazione.

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
- Prima dei task di un caso d'uso, l'agente `controllo-modelli` confronta caso
  d'uso (`docs/rad/uc/`), sequence, class diagram, statechart, SDD (`docs/sdd/`)
  e category partition (`docs/test/`).
- Il class diagram di analisi (qui) fissa i nomi del dominio; lo schema del
  database segue il class diagram ristrutturato dell'SDD (`docs/sdd/CD_persistenza.puml`).
