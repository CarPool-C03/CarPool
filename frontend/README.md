# Frontend

Applicazione web React con Fluent UI (responsive), che comunica con il backend tramite le
API REST.

La cartella è vuota finché non viene eseguito il task di impostazione del
progetto (creazione di `package.json`, scelta del framework di test, script
`lint`, `test` e `build`). Da quel momento la CI esegue qui `npm ci`,
`npm run lint`, `npm test` e `npm run build` a ogni pull request.

## Regole

- Il frontend (InterfacciaUtenteSubsystem) chiama solo le API REST del backend:
  non accede mai al database né al provider e-mail.
- Pagine e componenti seguono i mockup e il path navigazionale del RAD;
  nei casi d'uso non si citano pulsanti o elementi di interfaccia.
- I test stanno accanto ai componenti (`*.test.jsx`) e il loro nome contiene
  l'identificativo del caso di test del TCS, quando ne deriva.
