# SDD in formato testuale

Trascrizione di `C03_SDD_V_0.1.0` (16/11/2026). Le conversioni vanno
controllate dagli autori dell'SDD; se l'SDD cambia, si aggiornano qui e in
`AGENTS.md` nella stessa PR.

| File | Da dove viene | Cosa ne ricavano gli agenti |
|---|---|---|
| `component.puml` | Sez. 3.2.1–3.2.2: sottosistemi, interfacce, dipendenze | Cartelle del backend, servizi (Facade) e chi può usare chi |
| `deployment.puml` | Sez. 3.3.1: nodi e protocolli | Stack, connessioni (PostgreSQL/TLS, provider e-mail), attività pianificata |
| `CD_persistenza.puml` | Sez. 4.2: class diagram ristrutturato | Schema del database: tabelle, colonne, PK/FK, vincoli (livelli L1–L2) |

## Sottosistemi e cartelle del backend

| Sottosistema (strato) | Interfaccia | Cartella | Casi d'uso |
|---|---|---|---|
| InterfacciaUtenteSubsystem (presentazione) | — | `frontend/src/` | tutti |
| GestioneAccountProfiloSubsystem | AccountService | `backend/src/subsystems/account/` | UC_AUTH_01–08, UC_ADM_04 |
| GestioneViaggiPrenotazioniSubsystem | ViaggioPrenotazioneService | `backend/src/subsystems/viaggiPrenotazioni/` | UC_TRIP_01–06, 08, 11–14 |
| GestioneOrganizzazioniSubsystem | OrganizzazioneService | `backend/src/subsystems/organizzazioni/` | UC_ADM_01–03, RF_ORG_03 |
| ReportisticaPSCLSubsystem | ReportService | `backend/src/subsystems/reportistica/` | UC_ORG_01–02 |
| ValutazioniMessaggiSubsystem | ComunitaService | `backend/src/subsystems/valutazioniMessaggi/` | UC_TRIP_09, 10, 15 |
| NotificheSubsystem (servizi) | NotificaService | `backend/src/subsystems/notifiche/` | — |
| PersistenzaSubsystem (servizi) | PersistenzaService | `backend/src/subsystems/persistenza/` | — |
| LoggingSubsystem (servizi) | LogService | `backend/src/subsystems/logging/` | — |

Le route REST (`backend/src/routes/`) ricevono le richieste dell'interfaccia e
chiamano solo i Service dei cinque sottosistemi applicativi. Le migrazioni
dello schema stanno in `backend/migrations/` (una per gruppo di tabelle, in
ordine di chiavi esterne: vedi `docs/sviluppo-bottom-up.md`).

La struttura delle cartelle è quella dell'ODD (`docs/odd/`): sottosistemi in
`backend/src/subsystems/`, route in `backend/src/routes/`.

## Dipendenze ammesse

| Cartella (`subsystems/`) | Può usare |
|---|---|
| account | OrganizzazioneService, NotificaService, PersistenzaService, LogService |
| viaggiPrenotazioni | AccountService, OrganizzazioneService, NotificaService, PersistenzaService, LogService |
| organizzazioni | PersistenzaService, LogService |
| reportistica | AccountService, OrganizzazioneService, PersistenzaService, LogService |
| valutazioniMessaggi | ViaggioPrenotazioneService, PersistenzaService, LogService |
| notifiche | LogService, provider e-mail |
| persistenza | DBMS (driver PostgreSQL), LogService |
| logging | nessuno |

Ogni altro import tra cartelle è vietato. Un sottosistema usa un altro solo
tramite il suo Service, mai i suoi file interni.

## Registrazione degli errori (LogService, RNF_SUP_1, DG_16)

- Operazione: `LogService.registraErrore({ codice, descrizione, sottosistema })`, l'unica del Service.
- Scrive una riga JSON nel file di log dedicato (`LOG_FILE`, predefinito `logs/errori.log`) con
  `data` e `ora` (ISO 8601, UTC), `codice`, `descrizione`, `sottosistema`. La scrittura è
  asincrona e non blocca chi chiama; un errore di scrittura va solo sulla console.
- Codici: `ERRORE_INTERNO` (errori imprevisti, `sottosistema: backend`); `INVIO_EMAIL_FALLITO`
  (provider che rifiuta l'invio o non risponde, `sottosistema: notifiche`), con nella
  `descrizione` il tipo di e-mail e il motivo, **senza** l'indirizzo del destinatario.

## Control e boundary dei modelli di analisi → sottosistemi

| Classe di analisi (`docs/modelli/`) | Sottosistema |
|---|---|
| RegistraAccountControl | GestioneAccountProfiloSubsystem |
| PubblicaViaggioControl, CercaViaggioControl, RispondiRichiestaControl | GestioneViaggiPrenotazioniSubsystem |
| ValutaPartecipanteControl | ValutazioniMessaggiSubsystem |
| GeneraReportControl | ReportisticaPSCLSubsystem |
| Boundary dell'interfaccia (Registrazione, RicercaViaggio, …) | InterfacciaUtenteSubsystem |
| ServizioEmailBoundary | NotificheSubsystem (NotificaService) |

Quando un sequence diagram fa chiamare a un control un'entity di un altro
sottosistema (es. `Organizzazione.trovaPerDominio` da RegistraAccountControl),
nel codice la chiamata passa dal Service di quel sottosistema.

## Design goal che vincolano il codice

- **DG_1** report solo aggregati: i conteggi li calcola PersistenzaService, nessuna riga sui singoli Membri.
- **DG_3** sessione chiusa dopo 30 minuti di inattività (`Sessione.ultimaAttivita`).
- **DG_4** password solo come hash non reversibile (`Account.passwordHash`).
- **DG_5** controllo dei posti e accettazione nella stessa transazione.
- **DG_12** conferma inoltrata al provider entro 60 s; **DG_16** errori su file di log, senza bloccare.
- **DG_13** domini autorizzati in tabella (`DominioEmail`), non nel codice.
