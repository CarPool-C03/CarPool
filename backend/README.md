# Backend

API REST in Node.js / Express, con database PostgreSQL.

La cartella è vuota finché non viene eseguito il task di impostazione del
progetto (creazione di `package.json`, scelta del framework di test, script
`lint` e `test`). Da quel momento la CI esegue qui `npm ci`, `npm run lint`,
`npm test` e `npm run build` a ogni pull request.

## Struttura prevista

Il codice in `src/` segue i sottosistemi dell'SDD (`docs/sdd/README.md`,
`docs/sdd/component.puml`): una cartella per sottosistema (`account/`,
`viaggi/`, `organizzazioni/`, `reportistica/`, `comunita/`, `notifiche/`,
`persistenza/`, `logging/`), ognuna con un solo Service (Facade) e i propri
control e model; le route REST stanno in `src/api/` e chiamano solo i Service.

Solo `persistenza/` accede a PostgreSQL (schema in `docs/sdd/CD_persistenza.puml`),
solo `notifiche/` al provider e-mail. Un'attività pianificata conclude i viaggi.
I test stanno in `test/` e il loro nome contiene l'identificativo del caso di
test del TCS (es. `TC_TRIP_01.04`).

## Configurazione

Credenziali e connessione al database solo in variabili d'ambiente:
`.env` non si versiona, `.env.example` contiene i nomi delle variabili con
valori finti.
