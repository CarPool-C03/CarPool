# ODD in formato testuale

Trascrizione di `C03_ODD_V_0.1.0` (23/11/2026) per gli agenti. Va controllata
dagli autori dell'ODD; se l'ODD cambia, si aggiorna qui nella stessa PR.
Design goal, architettura e sottosistemi sono nell'SDD (`docs/sdd/`).

| File | Contenuto |
|---|---|
| `README.md` | I quattro pattern: ruoli, classi, dove stanno nel codice |
| `CD_ODD_pattern.puml` | Dettaglio di GestioneViaggiPrenotazioniSubsystem e NotificheSubsystem (Figura 6 dell'ODD) |

**Cartelle.** Nel repository vale la struttura dell'ODD: `backend/src/subsystems/<sottosistema>/`
per i sottosistemi e `backend/src/routes/` per le route (tabella in `docs/sdd/README.md`).

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

Dove: `backend/src/subsystems/<sottosistema>/<Nome>Service.js`; route in `backend/src/routes/`.
Le route e gli altri sottosistemi non chiamano mai le classi interne.

## Adapter

| Ruolo | Classi |
|---|---|
| Target | ProviderEmail (interfaccia): `invia(messaggio)` |
| Adapter | BrevoAdapter (SDK Brevo), ConsoleEmailAdapter (scrive su console: sviluppo e test) |
| Adaptee | TransactionalEmailsApi (SDK Brevo) |
| Client | NotificaService |

Dove: `backend/src/subsystems/notifiche/`. L'adapter si sceglie con una variabile d'ambiente.

**Messaggio** passato a `ProviderEmail.invia(messaggio)`: `{ destinatario, oggetto, html }`
(indirizzo e-mail, testo dell'oggetto, corpo HTML). Lo compone NotificaService; gli adapter lo
traducono nel formato del provider e restituiscono `true` se il provider ha accettato l'invio.
NotificaService avvia l'invio senza attendere il provider; restituisce subito `true` se la richiesta
è stata inoltrata e `false` se non è stato possibile avviarla. Un rifiuto o errore asincrono viene
registrato con LogService e non viene rilanciato al chiamante.

**`NotificaService.inviaLinkVerifica(email, link)`** (ServizioEmailBoundary.inviaLinkVerifica):
- `email`: indirizzo del Membro; il corpo HTML in italiano contiene il link di verifica ricevuto.
- oggetto: «Verifica il tuo account CarPool».

**`NotificaService.inviaEsitoPrenotazione(email, dati, esito)`** (ServizioEmailBoundary.inviaNotificaEsito):
- `email`: indirizzo del Passeggero; `esito`: `Accettata` o `Rifiutata` (stato della richiesta);
- `dati`: `{ nomePasseggero, nomeConducente, puntoPartenza, destinazione, dataOraPartenza }`,
  `dataOraPartenza` in ISO 8601; li raccoglie NotificaEsitoObserver dalla richiesta e dal viaggio;
- oggetto: «Richiesta di prenotazione accettata» (RF_TRIP_09) o «Richiesta di prenotazione rifiutata»
  (RF_TRIP_10); il corpo HTML riporta i campi di `dati` (data e ora nel formato `gg/mm/aaaa hh:mm`);
- restituisce `true` se l'invio è inoltrato al provider, `false` altrimenti; non lancia eccezioni:
  un fallimento si registra con LogService (`docs/sdd/README.md`, «Registrazione degli errori»).

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
Dove: `backend/src/subsystems/viaggiPrenotazioni/eventi/`.

## Strategy

| Ruolo | Classi |
|---|---|
| Strategy | CriterioRicerca (interfaccia): `costruisciFiltro(): Filtro` |
| ConcreteStrategy | RicercaPerSede (zona, sede, data, orario), RicercaPerEvento (evento, direzione, zona) |
| Context | RicercaViaggi |

`RicercaPerSede.costruisciFiltro()` restituisce un oggetto `Filtro` composto solo da valori, senza
frammenti SQL:

```text
{
  zona: String,
  sedeId: Intero,
  data: String (AAAA-MM-GG),
  orarioMinimo: String (HH:MM)
}
```

Data e orario sono interpretati nel fuso `Europe/Rome`, come nell'API. Il router ricava `membroId` e
`organizzazioneId` dal contesto di autenticazione lato server e li passa a
`ViaggioPrenotazioneService.cercaViaggi(criterio, membroId, organizzazioneId)`; non sono parametri
pubblici. La Facade verifica che `sedeId` appartenga all'organizzazione usando
`OrganizzazioneService.sediOrganizzazione(organizzazioneId)` e non avvia la ricerca se non vi
appartiene. Poi delega a `RicercaViaggi`, che riceve il criterio e `membroId`, applica le condizioni
comuni (viaggio `Attivo`, futuro, almeno un posto disponibile) e il criterio di esclusione dei
viaggi in cui `membroId` è conducente.
L'operazione del Context è `RicercaViaggi.cerca(criterio, membroId)`.

Non esiste un'operazione di ricerca specifica già esposta da `PersistenzaService` (l'operazione
`query(sql, parametri)` è generica). Si propone quindi di aggiungere
`PersistenzaService.cercaViaggi(filtro: Filtro, membroId: Intero): Promise<Array<{ id: Intero,
dataOraPartenza: DataOra, puntoPartenza: String, sede: { id: Intero, nome: String },
postiOfferti: Intero, postiDisponibili: Intero, contributoIndicativoEuro: Decimale | null,
stato: String, conducente: { id: Intero, nome: String, cognome: String } }>>`.
L'operazione esegue **un'unica query parametrizzata** per selezionare i viaggi `Attivo` e futuri,
compatibili con i quattro campi del filtro, con almeno un posto disponibile e senza il conducente
`membroId`. `zona` corrisponde a una sottostringa di `puntoPartenza` senza distinzione tra maiuscole
e minuscole. La query calcola `postiDisponibili` come `postiOfferti` meno il numero di richieste in
stato `Accettata`, ordina per `dataOraPartenza` e restituisce tutti i dati necessari al formato di
risposta dell'API. Se nessun viaggio corrisponde, restituisce una lista vuota.

Anche le operazioni di dettaglio viaggio esposte da `PersistenzaService` restituiscono
`postiDisponibili` calcolato sottraendo ai posti offerti le richieste `Accettata`. Il calcolo
appartiene alla persistenza, non all'entità `Viaggio`.

ViaggioPrenotazioneService crea il criterio adatto. Dove: `backend/src/subsystems/viaggiPrenotazioni/ricerca/`.

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
