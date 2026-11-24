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
2. **Task su Jira, issue su GitHub**: ogni task Jira (`C03-n`) ha una issue GitHub
   con le sezioni Specifica, Ambito e Verifica, e un branch dedicato.
3. **Agenti in locale** (OpenCode o GitHub Copilot in VS Code): pianificatore,
   implementatore, tester e revisore, uno alla volta. Guida passo passo:
   [docs/guida-agenti-in-locale.md](docs/guida-agenti-in-locale.md).
4. **Pull request** approvata da un PM diverso dall'autore, con la CI verde:
   regole in [CONTRIBUTING.md](CONTRIBUTING.md).

## Installazione e avvio

Prerequisiti: [Node.js](https://nodejs.org/) 22 o successivo, Git e, per il
database, [Docker Desktop](https://www.docker.com/products/docker-desktop/).
Su Windows usare Git Bash o PowerShell 7 come terminale di VS Code.

```bash
git clone https://github.com/CarPool-C03/CarPool.git
cd CarPool

# Database di sviluppo (porta 5432) e di test (porta 5433)
docker compose up -d

# Backend
cd backend
npm ci
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
npm run db:migrate        # porta il database di sviluppo all'ultima migrazione
npm run db:seed           # dati di sviluppo
npm run dev               # http://localhost:3000/api/health

# Frontend (in un secondo terminale, dalla radice del repository)
cd frontend
npm ci
npm run dev               # http://localhost:5173 mostra lo stato del backend
```

Il frontend inoltra le chiamate `/api` al backend (proxy di Vite, porta in
`frontend/vite.config.js`). Prima di ogni push, in ciascuna cartella toccata:
`npm run lint` e `npm test`. I test del backend usano il database di test
(`TEST_DATABASE_URL`) e lo portano da soli all'ultima migrazione.
Per fermare i database: `docker compose down`.

Questa sezione è la base del Manuale di Installazione.

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
