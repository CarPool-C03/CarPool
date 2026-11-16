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
| Database | relazionale *(da definire)* |

## Struttura del repository

```
carpool/
├── frontend/   # applicazione React
├── backend/    # API REST Node.js/Express
└── docs/       # RAD, SDD, ODD, documenti di test e di project management
```

## Installazione e avvio

> *Da completare con lo sviluppo* (prerequisiti, variabili d'ambiente, comandi di avvio di frontend e backend). Questa sezione costituirà la base del Manuale di Installazione.

## Come contribuire

- Sviluppo **pull-based**: nessun push diretto su `main`.
- Una branch e una **pull request per ogni funzionalità**, revisionata da almeno un altro membro prima del merge.
- I **test** si scrivono insieme alla funzionalità.
- Ogni pull request riporta nel titolo o nella descrizione l'ID del task Jira e dei requisiti coinvolti (es. `RF_TRIP_01`).

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
