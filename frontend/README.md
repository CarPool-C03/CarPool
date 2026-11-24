# Frontend

Applicazione web React con Fluent UI (responsive), che comunica con il backend tramite le
API REST.

Stack: React, Vite, Fluent UI (`@fluentui/react-components`), React Router;
test con Vitest e Testing Library. Script: `dev`, `build`, `lint`, `test`,
`format`. La CI esegue qui `npm ci`, `npm run lint`, `npm test` e
`npm run build` a ogni pull request.

```
frontend/src/
├── main.jsx        # tema Fluent UI e router
├── App.jsx         # rotte (una pagina per percorso)
└── pages/          # pagine, con i test accanto (Home.jsx, Home.test.jsx)
```

In sviluppo le chiamate a `/api` vanno al backend tramite il proxy di Vite
(`vite.config.js`, variabile `VITE_BACKEND_URL`, predefinito `http://localhost:3000`).

## Regole

- Il frontend (InterfacciaUtenteSubsystem) chiama solo le API REST del backend:
  non accede mai al database né al provider e-mail.
- Pagine, percorsi e menu seguono `docs/rad/mockup/README.md`; campi ed errori `docs/api/`;
  nei casi d'uso non si citano pulsanti o elementi di interfaccia.
- I test stanno accanto ai componenti (`*.test.jsx`) e il loro nome contiene
  l'identificativo del caso di test del TCS, quando ne deriva.
