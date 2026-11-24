# Backend

API REST in Node.js / Express, con database PostgreSQL.

Script: `dev` (nodemon), `start`, `lint`, `test` (Jest + Supertest, test in
serie con `--runInBand`), `format`. La CI esegue qui `npm ci`, `npm run lint` e
`npm test` a ogni pull request. `src/app.js` crea l'applicazione Express (usata
dai test), `src/server.js` la mette in ascolto sulla porta `PORT` di `.env`.

## Struttura prevista

```
backend/
├── src/
│   ├── subsystems/
│   │   ├── persistenza/          # unico accesso a PostgreSQL (PersistenzaService)
│   │   ├── logging/              # LogService, su file
│   │   ├── notifiche/            # NotificaService + ProviderEmail (Adapter)
│   │   ├── account/              # AccountService
│   │   ├── organizzazioni/       # OrganizzazioneService
│   │   ├── viaggiPrenotazioni/   # ViaggioPrenotazioneService (+ eventi/, ricerca/)
│   │   ├── valutazioniMessaggi/  # ComunitaService
│   │   └── reportistica/         # ReportService
│   └── routes/          # route REST: chiamano solo i Service
├── migrations/          # una migrazione per gruppo di tabelle (L1)
├── seeds/               # dati di sviluppo e dell'ambiente di test comune
└── test/                # test di integrazione (L1–L3) e dei casi d'uso (L4)
```

Ogni cartella di `src/subsystems/` è un sottosistema dell'SDD (`docs/sdd/README.md`) con un
solo Service (Facade). Si sviluppa dal basso: prima `migrations/` e
`subsystems/persistenza/`, poi i servizi, poi i casi d'uso (`docs/sviluppo-bottom-up.md`).

## Regole

- Tabelle e colonne come in `docs/sdd/CD_persistenza.puml`.
- Una migrazione già nel `main` non si modifica: si aggiunge una nuova migrazione.
- Controllo dei posti e accettazione nella stessa transazione (DG_5).
- I test di integrazione usano il database di test e lo riportano allo stato
  iniziale prima di ogni test; i nomi dei test dei casi d'uso contengono
  l'identificativo del TCS (es. `TC_TRIP_01.04`).
- Nessun file oltre le 200 righe.

## Configurazione

Credenziali e connessione al database solo in variabili d'ambiente:
`.env` non si versiona, `.env.example` contiene i nomi delle variabili con
valori finti (`DATABASE_URL`, `EMAIL_PROVIDER=console|brevo`, `BREVO_API_KEY`).
