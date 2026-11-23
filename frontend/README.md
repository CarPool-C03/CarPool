# Frontend

Applicazione web React (responsive), che comunica con il backend tramite le
API REST.

La cartella è vuota finché non viene eseguito il task di impostazione del
progetto (creazione di `package.json`, scelta del framework di test, script
`lint`, `test` e `build`). Da quel momento la CI esegue qui `npm ci`,
`npm run lint`, `npm test` e `npm run build` a ogni pull request.

## Regole

- Il frontend chiama solo le API del backend: non accede mai al database.
- Pagine e componenti seguono i mockup e il path navigazionale del RAD;
  nei casi d'uso non si citano pulsanti o elementi di interfaccia.
- I test stanno accanto ai componenti (`*.test.jsx`) e il loro nome contiene
  l'identificativo del caso di test del TCS, quando ne deriva.
