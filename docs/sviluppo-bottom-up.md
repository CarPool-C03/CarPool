# Strategia di sviluppo: bottom-up dal database

CarPool si costruisce **dal basso verso l'alto**: prima lo schema del database,
poi l'accesso ai dati, poi i servizi e i casi d'uso, infine le API e
l'interfaccia. Ogni livello si appoggia solo su quelli già completati e
provati, e si integra con test di integrazione scritti a quel livello.

Il backlog è su Jira (una epic per livello, un task per unità di lavoro);
ogni task Jira ha una issue GitHub collegata (`C03-n` nel titolo).

## I livelli

| Livello | Cosa si costruisce | Dove | Fonte (specifica) | Come si verifica |
|---|---|---|---|---|
| **L0 Fondamenta** | progetto backend, PostgreSQL locale, tool di migrazione, connessione e transazioni, log | `backend/`, `backend/src/subsystems/persistenza/`, `backend/src/subsystems/logging/` | `docs/sdd/README.md`, `docs/sdd/deployment.puml` | CI verde, `npm run db:migrate` funziona da zero |
| **L1 Schema** | migrazioni delle tabelle, vincoli, indici, dati di seed | `backend/migrations/`, `backend/seeds/` | `docs/sdd/CD_persistenza.puml` | test che i vincoli rifiutano i dati non validi |
| **L2 Accesso ai dati** | funzioni di PersistenzaService per gruppo di entità | `backend/src/subsystems/persistenza/` | `CD_persistenza.puml`, design goal DG_1, DG_5 | test di integrazione su DB di test |
| **L3 Servizi trasversali** | NotificaService con Adapter | `backend/src/subsystems/notifiche/` | ODD 2.3 (`docs/odd/`) | test con `ConsoleEmailAdapter` |
| **L4 Casi d'uso** | Service (Facade), control e route REST | `backend/src/subsystems/<sottosistema>/`, `backend/src/routes/` | caso d'uso, sequence, class diagram, ODD | test dai test frame del TCS (`docs/test/`) |
| **L5 Interfaccia** | pagine e componenti React | `frontend/src/` | mockup e path navigazionale del RAD | test dei componenti |

## Ordine dentro L1 e L2

Le migrazioni seguono le chiavi esterne: una tabella si crea dopo quelle che
riferisce. L'ordine è anche quello delle dipendenze tra i task Jira.

1. `Organizzazione`, `DominioEmail`, `Sede` — `Account`, `Sessione`, `TokenVerifica` (in parallelo)
2. `Membro`, `Veicolo`
3. `Evento`, `Viaggio` (con gli indici per la ricerca, DG_7 / RNF_PERF_3)
4. `RichiestaPrenotazione` — `Valutazione`, `Messaggio` (in parallelo)
5. Seed di sviluppo e di test (organizzazione e membri dell'ambiente comune, `docs/test/ambiente.md`)

Ogni task di L2 parte quando sono pronte la migrazione delle sue tabelle e la
connessione di L0. Chi scrive una migrazione scrive anche l'accesso ai dati
delle stesse tabelle, così lo schema e il suo uso hanno lo stesso proprietario.

## Regole

- **Un livello alla volta per area.** Non si scrive un control (L4) su tabelle
  che non hanno ancora migrazione e accesso ai dati mergiati.
- **Lo schema è condiviso.** Una modifica a una migrazione già nel `main` si
  fa con una **nuova** migrazione, mai modificando quella esistente, e va
  approvata dai PM perché tocca tutti i livelli sopra.
- **Nomi.** Tabelle e colonne come in `docs/sdd/CD_persistenza.puml`; classi e
  metodi come nel class diagram di analisi e nell'ODD.
- **Test a ogni livello.** L1 e L2 usano un database PostgreSQL di test
  (in CI è il servizio `postgres` di `.github/workflows/ci.yml`); L4 usa i test
  frame del TCS. I test di un livello non dipendono da codice dei livelli sopra.
- **Interfacce stabili.** Le firme pubbliche di PersistenzaService usate da
  altri task si cambiano solo con una PR dedicata, approvata dai PM.

## Definition of Done di un task

- [ ] Branch e PR dedicati al task (`C03-n` in titolo e commit).
- [ ] Solo file dell'ambito indicato nella issue.
- [ ] Test del livello scritti e verdi in locale e in CI.
- [ ] Nessuna migrazione esistente modificata; nessuna dipendenza nuova non approvata.
- [ ] Nessun file oltre le 200 righe (regola del progetto, vedi `AGENTS.md`).
- [ ] Approvato da un PM diverso dall'autore; l'autore sa spiegare il codice.
- [ ] Task Jira aggiornato.
