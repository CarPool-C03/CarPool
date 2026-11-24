# ODD in formato testuale

Trascrizione di `C03_ODD_V_0.1.0` (23/11/2026) per gli agenti. Va controllata
dagli autori dell'ODD; se l'ODD cambia, si aggiorna qui nella stessa PR.
Design goal, architettura e sottosistemi sono nell'SDD (`docs/sdd/`).

| File | Contenuto |
|---|---|
| `README.md` | I quattro pattern: ruoli, classi, dove stanno nel codice |
| `CD_ODD_pattern.puml` | Dettaglio di GestioneViaggiPrenotazioniSubsystem e NotificheSubsystem (Figura 6 dell'ODD) |

**Cartelle.** L'ODD scrive `backend/src/subsystems/<sottosistema>/` e
`backend/src/routes/`; nel repository valgono `backend/src/<sottosistema>/` e
`backend/src/api/` (`docs/sdd/README.md`). Le cartelle sotto sono già convertite.

## Riepilogo

| Pattern | Tipo | Problema risolto | Dove | Motivazione |
|---|---|---|---|---|
| Facade | Strutturale | Ogni sottosistema offre agli altri un unico punto di accesso | Tutti i sottosistemi | SDD Sez. 3.1; DG_2, DG_5 |
| Adapter | Strutturale | Usare il provider e-mail senza legarsi alla sua API | NotificheSubsystem | RNF_INT_1; DG_12 |
| Observer | Comportamentale | Notifiche ai cambi di stato delle prenotazioni senza che la logica delle prenotazioni le conosca | GestioneViaggiPrenotazioniSubsystem | DG_12; RF_TRIP_09, 10, 16–18 |
| Strategy | Comportamentale | Criteri di ricerca diversi con un'unica operazione di ricerca | GestioneViaggiPrenotazioniSubsystem | DG_7; RF_TRIP_03, RF_TRIP_20a |

In tutti i casi le classi collaborano per delega, non per ereditarietà.
Scartati: Bridge (il provider esiste già), Proxy e Abstract Factory (nessun requisito).

## Facade

| Ruolo | Classi |
|---|---|
| Facade | AccountService, OrganizzazioneService, ViaggioPrenotazioneService, ComunitaService, ReportService, NotificaService, LogService, PersistenzaService |
| Classi del sottosistema | classi interne, es. GestoreViaggi, GestorePrenotazioni, RicercaViaggi in GestioneViaggiPrenotazioniSubsystem |
| Client | route REST (es. ViaggiRouter, `/api/viaggi`) e Facade degli altri sottosistemi |

Dove: `backend/src/<sottosistema>/<Nome>Service.js`; route in `backend/src/api/`.
Le route e gli altri sottosistemi non chiamano mai le classi interne.

## Adapter

| Ruolo | Classi |
|---|---|
| Target | ProviderEmail (interfaccia): `invia(messaggio)` |
| Adapter | BrevoAdapter (SDK Brevo), ConsoleEmailAdapter (scrive su console: sviluppo e test) |
| Adaptee | TransactionalEmailsApi (SDK Brevo) |
| Client | NotificaService |

Dove: `backend/src/notifiche/`. L'adapter si sceglie con una variabile d'ambiente.

## Observer

| Ruolo | Classi |
|---|---|
| Subject | EventiPrenotazione |
| Observer | OsservatorePrenotazione (interfaccia) |
| ConcreteObserver | NotificaEsitoObserver (chiama NotificaService) |
| Stato notificato | EventoPrenotazione: tipo di evento, richiesta e viaggio coinvolti |

**Dopo il commit** della transazione, GestorePrenotazioni pubblica un
EventoPrenotazione; gli osservatori sono registrati all'avvio. Una nuova notifica
(es. RF_TRIP_17) si aggiunge con un nuovo osservatore.
Dove: `backend/src/viaggi/eventi/`.

## Strategy

| Ruolo | Classi |
|---|---|
| Strategy | CriterioRicerca (interfaccia): costruisce il Filtro della query |
| ConcreteStrategy | RicercaPerSede (zona, sede, data, orario), RicercaPerEvento (evento, direzione, zona) |
| Context | RicercaViaggi |

RicercaViaggi aggiunge le condizioni comuni (viaggio Attivo, futuro, almeno un
posto disponibile) e fa eseguire **un'unica query** a PersistenzaService (DG_7).
ViaggioPrenotazioneService crea il criterio adatto. Dove: `backend/src/viaggi/ricerca/`.

## Glossario delle classi introdotte

| Classe | Definizione |
|---|---|
| BrevoAdapter | Implementa ProviderEmail con il SDK di Brevo |
| ConsoleEmailAdapter | Implementa ProviderEmail scrivendo sulla console; sviluppo e test |
| CriterioRicerca | Interfaccia dei criteri di ricerca; ognuno costruisce il proprio filtro |
| EventiPrenotazione | Conserva gli osservatori e notifica i cambi di stato delle richieste |
| EventoPrenotazione | Dato inviato agli osservatori: tipo, richiesta, viaggio |
| Filtro | Condizioni e parametri della query prodotti da un CriterioRicerca |
| GestorePrenotazioni | Invio, risposta e annullamento delle richieste di prenotazione |
| GestoreViaggi | Pubblicazione, modifica, cancellazione e conclusione dei viaggi |
| NotificaEsitoObserver | Invia al Passeggero, tramite NotificaService, l'esito della richiesta |
| OsservatorePrenotazione | Interfaccia comune degli osservatori |
| ProviderEmail | Interfaccia con cui NotificaService invia le e-mail |
| RicercaPerEvento / RicercaPerSede | Criteri di ricerca verso un evento / verso una sede |
| RicercaViaggi | Esegue la ricerca applicando un CriterioRicerca |
| ViaggiRouter | Route REST `/api/viaggi` verso ViaggioPrenotazioneService |

Il rapporto tra queste classi e i control dei modelli di analisi
(PubblicaViaggioControl, RispondiRichiestaControl, CercaViaggioControl) è un
contrasto aperto: vedi M5 in `docs/modelli/README.md`.
