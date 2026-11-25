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
├── api/            # client REST e classi di errore
├── auth/           # contesto dell'utente autenticato
├── components/     # componenti riusabili (RottaProtetta, CampoModulo)
├── layout/         # intestazione e menu per ruolo
└── pages/          # pagine, con i test accanto (Home.jsx, Home.test.jsx)
```

In sviluppo le chiamate a `/api` vanno al backend tramite il proxy di Vite
(`vite.config.js`, variabile `VITE_BACKEND_URL`, predefinito `http://localhost:3000`).

## Regole

- Il frontend (InterfacciaUtenteSubsystem) chiama solo le API REST del backend:
  non accede mai al database né al provider e-mail.
- `UtenteProvider` chiama `GET /api/auth/me` con `fetch` diretto e
  `credentials: "include"`; 401/404 = visitatore. Le altre chiamate passano da
  `src/api/client.js`, che su 401 porta a `/login`. Le pagine non ancora
  implementate usano `pages/PaginaVuota.jsx`.
- Pagine, percorsi e menu seguono `docs/rad/mockup/README.md`; campi ed errori `docs/api/`;
  nei casi d'uso non si citano pulsanti o elementi di interfaccia.
- I test stanno accanto ai componenti (`*.test.jsx`) e il loro nome contiene
  l'identificativo del caso di test del TCS, quando ne deriva.
