# CarPool

Piattaforma web di carpooling riservata ai membri verificati di aziende e atenei, per condividere l'auto nei tragitti ricorrenti verso la sede di lavoro o di studio e nei viaggi verso eventi.

Progetto del **Team C03** per i corsi di *Gestione dei Progetti Software* e *Ingegneria del Software* (Prof.ssa F. Ferrucci, Prof. F. Palomba) – Università degli Studi di Salerno, a.a. 2026/2027.

## Funzionalità principali

- **Accesso riservato**: registrazione solo con l'email di un'organizzazione partner, che ne determina l'appartenenza.
- **Viaggi**: pubblicazione, ricerca e prenotazione di passaggi verso una sede o verso un evento.
- **Prenotazioni**: il conducente accetta o rifiuta le richieste; i posti disponibili si aggiornano.
- **Notifiche e messaggi** via email tra conducente e passeggeri.
- **Valutazioni reciproche** al termine del viaggio.
- **Cruscotto del Mobility Manager**: statistiche aggregate e anonime per sede e periodo, a supporto del PSCL (D.L. 34/2020, art. 229; D.I. 179/2021).

Fuori dall'ambito: pagamenti, tracciamento GPS in tempo reale, app mobile nativa, verifica dei documenti.

## Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Frontend | React (web app responsive) |
| Backend | Node.js / Express, API REST |
| Database | PostgreSQL |

## Struttura del repository

```
CarPool/
├── frontend/   # applicazione React (vedi frontend/README.md)
├── backend/    # API REST Node.js/Express (vedi backend/README.md)
├── docs/       # RAD, SDD, ODD, modelli (PlantUML), category partition, guide
├── scripts/    # script di supporto (label, controlli della CI)
├── AGENTS.md   # istruzioni comuni per gli agenti (Copilot, OpenCode)
└── .github/    # workflow, agenti Copilot, moduli delle issue, template PR
```

## Installazione e avvio

> *Da completare con lo sviluppo* (prerequisiti, variabili d'ambiente, comandi di avvio di frontend e backend). Questa sezione costituirà la base del Manuale di Installazione.

## Come contribuire

Il flusso completo (branch, commit, pull request, review e merge) è descritto in [CONTRIBUTING.md](CONTRIBUTING.md).

- Sviluppo **pull-based**: nessun push diretto su `main`.
- Un branch e una **pull request per ogni task Jira** (per lo sviluppo, un caso d'uso per task), approvata da un Project Manager diverso dall'autore e con la CI verde.
- I **test** si scrivono dai test frame del caso d'uso in `docs/test/`, non guardando il codice.
- Commit e titolo della PR seguono il formato `CP-12 UC_TRIP_01: descrizione`; la descrizione della PR si compila dal template.

## Lavorare con gli agenti

Il team usa GitHub Copilot e OpenCode dentro una pipeline definita dai PM:
task da issue form, piano approvato da una persona, implementazione e test da
agenti separati, CI e revisione rispetto ai modelli prima del merge.

- Guida per il team: [docs/agentic-workflow.md](docs/agentic-workflow.md)
- Configurazione (PM): [docs/setup-pipeline-pm.md](docs/setup-pipeline-pm.md)
- Istruzioni lette da ogni agente: [AGENTS.md](AGENTS.md)

## Team

| Nome | Ruolo |
|---|---|
| Pietro Coticella | Project Manager |
| Giuseppe D'Ambrosio | Project Manager |
| Michele Vitiello | Team Member |
| Giovanni Scarico | Team Member |
| Roberto Rega | Team Member |
| Simone Esposito | Team Member |
| Gennaro Garone | Team Member |
| Vladyslav Maslov | Team Member |
