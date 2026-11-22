# SDD in formato testuale

| File | Da dove viene | Cosa ne ricavano gli agenti |
|---|---|---|
| `component.puml` | Component diagram dell'SDD | Struttura delle cartelle e regole su chi può usare chi (es. le route non usano mai lo storage) |
| `deployment.puml` | Deployment diagram dell'SDD | Stack, librerie ammesse, configurazione, connessione a PostgreSQL |

Le regole di questi due diagrammi valgono per tutti i task: sono già riassunte
in `AGENTS.md` (sezioni «Stack» e «Struttura»). Quando cambiano qui, va
aggiornato anche `AGENTS.md` nella stessa PR.
