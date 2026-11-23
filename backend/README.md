# Backend

API REST in Node.js / Express, con database PostgreSQL.

La cartella è vuota finché non viene eseguito il task di impostazione del
progetto (creazione di `package.json`, scelta del framework di test, script
`lint` e `test`). Da quel momento la CI esegue qui `npm ci`, `npm run lint`,
`npm test` e `npm run build` a ogni pull request.

## Struttura prevista

Il codice in `src/` segue il component diagram (`docs/sdd/component.puml`) e
il modello a oggetti del RAD:

- **boundary**: route e controller delle API REST;
- **control**: logica dei casi d'uso (es. `PubblicaViaggioControl`);
- **entity / model**: oggetti del class diagram (`docs/modelli/CD_CP_01_Entity.puml`);
- **storage**: accesso a PostgreSQL.

Le route non accedono mai direttamente allo storage o al database
(regola in `AGENTS.md`). I test stanno in `test/` e il loro nome contiene
l'identificativo del caso di test del TCS (es. `TC_TRIP_01.04`).

## Configurazione

Credenziali e connessione al database solo in variabili d'ambiente:
`.env` non si versiona, `.env.example` contiene i nomi delle variabili con
valori finti.
