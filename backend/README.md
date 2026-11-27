# Backend

API REST in Node.js / Express, con database PostgreSQL.

Script: `dev` (nodemon), `start`, `lint`, `test` (Jest + Supertest, test in
serie con `--runInBand`), `format`, `db:migrate`, `db:migrate:down`,
`db:migrate:nuova -- <nome>` (crea una migrazione da `templates/migrazione.cjs`),
`db:seed`. La CI esegue qui `npm ci`, `npm run lint` e
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
├── templates/           # modello delle migrazioni (db:migrate:nuova)
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
valori finti. In locale usare i valori di sviluppo; nell'hosting impostare:

- `NODE_ENV=production`;
- `FRONTEND_URL` all'origine HTTPS esatta del frontend;
- `DATABASE_URL` con `?sslmode=require` e `DATABASE_SSL=true`;
- `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY` e `EMAIL_MITTENTE` (mittente
  verificato in Brevo; richiesto da `BrevoAdapter`);
- `ADMIN_PASSWORD` solo quando si esegue il seed di produzione.

Non inserire segreti nel repository. Il frontend e l'API devono essere HTTPS e
sotto lo stesso dominio registrabile per mantenere il cookie di sessione
`SameSite=Lax`. CORS accetta solo `FRONTEND_URL` e abilita le richieste con
credenziali.

### Render

Il servizio è definito nel Blueprint `render.yaml` alla radice del repository:
nome `carpool-api`, root `backend`, Node.js 22, build `npm ci`, avvio `npm start`,
health check `GET /api/health`, piano always-on e una sola istanza.

- URL pubblico atteso: `https://carpool-api.onrender.com` (da verificare dopo il
  primo deploy).
- Le variabili con `sync: false` (`DATABASE_URL`, `FRONTEND_URL`,
  `BREVO_API_KEY`, `EMAIL_MITTENTE`) si impostano nella dashboard Render, mai
  nel repository.
- Al primo deploy eseguire `npm run db:migrate`, poi `node seeds/produzione.js`
  una sola volta con `ADMIN_PASSWORD` impostata.
- `NODE_ENV=production`, `DATABASE_SSL=true` e `NODE_VERSION=22` sono nel
  Blueprint.

## Database

- `docker compose up -d` (radice del repository) avvia due PostgreSQL 16:
  sviluppo sulla porta 5432 (`carpool_dev`), test sulla porta 5433 (`carpool_test`).
- `PersistenzaService` (`src/subsystems/persistenza/`) è l'unico accesso al
  database: `query(sql, parametri)`, `transazione(fn)` (COMMIT o ROLLBACK, DG_5),
  `chiudi()`. Le funzioni per gruppo di entità si aggiungono nei task L2.
- I test usano `TEST_DATABASE_URL` (in CI: `DATABASE_URL`, già di test); prima
  di tutti i test `test/global-setup.js` applica le migrazioni.
- TLS solo con `DATABASE_SSL=true` (database in cloud).
- In produzione usare il branch `prod` di Neon e `DATABASE_URL` con
  `?sslmode=require`; `DATABASE_SSL=true` abilita TLS anche per il driver.
- Dopo aver configurato il database, eseguire `npm run db:migrate`, quindi
  `node seeds/produzione.js` una sola volta con `ADMIN_PASSWORD` impostata
  nell'ambiente. Il seed crea l'organizzazione UNISA e l'Amministratore.
- Collegare i deploy di frontend e backend al branch `main`. Il backend deve
  restare attivo con una sola istanza per eseguire l'attività pianificata.
