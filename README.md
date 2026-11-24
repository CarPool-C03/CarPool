# CarPool

Piattaforma web di carpooling riservata ai membri verificati di aziende e atenei, per condividere l'auto nei tragitti ricorrenti verso la sede di lavoro o di studio e nei viaggi verso eventi.

Progetto del **Team C03** per i corsi di *Gestione dei Progetti Software* e *Ingegneria del Software* (Prof.ssa F. Ferrucci, Prof. F. Palomba) – Università degli Studi di Salerno, a.a. 2026/2027.

## Funzionalità principali

- **Accesso riservato**: registrazione solo con l'e-mail di un'organizzazione partner, che ne determina l'appartenenza.
- **Viaggi**: pubblicazione, ricerca e prenotazione di passaggi verso una sede o verso un evento.
- **Prenotazioni**: il conducente accetta o rifiuta le richieste; i posti disponibili si aggiornano.
- **Notifiche via e-mail** sull'esito delle prenotazioni e **messaggi** tra conducente e passeggeri dentro la piattaforma.
- **Valutazioni reciproche** al termine del viaggio.
- **Cruscotto del Mobility Manager**: statistiche aggregate e anonime per sede e periodo, a supporto del PSCL (D.L. 34/2020, art. 229; D.I. 179/2021).

Fuori dall'ambito: pagamenti, tracciamento GPS in tempo reale, app mobile nativa, verifica dei documenti.

## Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Frontend | React + Fluent UI (web app responsive) |
| Backend | Node.js / Express, API REST |
| Database | PostgreSQL |
| Provider e-mail | Brevo (tramite Adapter, vedi ODD) |

## Struttura del repository

```
CarPool/
├── backend/
│   ├── src/subsystems/       # account, organizzazioni, viaggiPrenotazioni,
│   │                         # valutazioniMessaggi, reportistica, notifiche,
│   │                         # persistenza, logging (un Service Facade ciascuno)
│   ├── src/routes/           # route REST (chiamano solo i Service)
│   ├── migrations/           # migrazioni del database (L1)
│   ├── seeds/                # dati di sviluppo e di test
│   └── test/
├── frontend/                 # applicazione React
├── docs/
│   ├── rad/uc/               # casi d'uso (copia testuale del RAD)
│   ├── modelli/              # class, sequence, statechart (PlantUML)
│   ├── sdd/                  # sottosistemi, deployment, schema del DB
│   ├── odd/                  # design pattern e classi che introducono
│   ├── test/                 # category partition e casi di test (TCS)
│   ├── sviluppo-bottom-up.md # livelli e ordine di sviluppo
│   └── guida-agenti-in-locale.md
├── scripts/                  # controlli della CI
├── AGENTS.md                 # istruzioni lette da ogni agente
└── .github/                  # CI, agenti Copilot, moduli delle issue, template PR
```

## Come lavoriamo

1. **Strategia bottom-up** dal database: livelli, ordine e Definition of Done in
   [docs/sviluppo-bottom-up.md](docs/sviluppo-bottom-up.md).
2. **Task su Jira, issue su GitHub**: ogni task Jira (`CP-n`) ha una issue GitHub
   creata dal modulo *Task* e un branch dedicato.
3. **Agenti in locale** (OpenCode o GitHub Copilot in VS Code): pianificatore,
   implementatore, tester e revisore, uno alla volta. Guida passo passo:
   [docs/guida-agenti-in-locale.md](docs/guida-agenti-in-locale.md).
4. **Pull request** approvata da un PM diverso dall'autore, con la CI verde:
   regole in [CONTRIBUTING.md](CONTRIBUTING.md).

## Installazione e avvio

> *Da completare con il task L0 di impostazione del progetto* (prerequisiti,
> variabili d'ambiente, avvio del database, migrazioni, avvio di frontend e
> backend). Questa sezione costituirà la base del Manuale di Installazione.

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
