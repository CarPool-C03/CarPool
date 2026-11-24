# API: account, autenticazione, profilo

Convenzioni ed errori comuni: [README.md](README.md). Sottosistema: `account` (AccountService).

## POST /api/account/registrazione — #12 · UC_AUTH_01
Ruoli: nessuno (visitatore). Service: `AccountService.registra(dati)` (RegistraAccountControl.registra).

Corpo: `{ "nome", "cognome", "email", "password" }`

| Campo | Regola | Errore 400 sul campo |
|---|---|---|
| `nome`, `cognome` | obbligatori, 1–100 caratteri | mancante o troppo lungo |
| `email` | obbligatoria, formato e-mail, max 254 | formato non valido |
| `email` | dominio di un'organizzazione partner attiva (`OrganizzazioneService.riconosciDominio`) | «dominio non autorizzato» (UC 4.a1) |
| `email` | non già associata a un account | «e-mail già registrata» (UC 4.b1) |
| `password` | obbligatoria, almeno 8 caratteri **(PM)** | troppo corta |

Effetti: Account `InAttesaDiVerifica` (email in minuscolo, solo hash bcrypt), Membro collegato
all'organizzazione del dominio, TokenVerifica `VerificaEmail` con scadenza 24 ore, e-mail con il link
`<FRONTEND_URL>/verifica?token=<token>` tramite `NotificaService.inviaVerificaAccount(email, link)`.

Risposta `201`: `{ "messaggio": "Ti abbiamo inviato un link di verifica all'indirizzo indicato" }`

## POST /api/account/verifica — #12 · UC_AUTH_01 passi 7–8
Ruoli: nessuno. Service: `AccountService.verificaLink(token)` (RegistraAccountControl.verificaLink).

Corpo: `{ "token" }` (la pagina `/verifica` del frontend lo legge dall'indirizzo e lo invia).
Token valido, non scaduto, non usato → Account `Attivo`, `usatoIl` = adesso.
Risposta `200`: `{ "messaggio": "Account attivato" }`. Token non valido, scaduto o già usato → `400`
con `campo: "token"` (UC 8.a1, l'account resta `InAttesaDiVerifica`).

## POST /api/auth/login — #13
Ruoli: nessuno. Service: `AccountService.accedi(email, password)`.
Corpo: `{ "email", "password" }`. Credenziali errate → `401` `CREDENZIALI_NON_VALIDE` con messaggio
generico (RF_AUTH_06); account non `Attivo` → `403` `ACCOUNT_NON_ATTIVO`.
Risposta `200`: l'utente corrente (come `GET /api/auth/me`) e il cookie `carpool_sessione`.

## POST /api/auth/logout — #13
Ruoli: autenticato. Service: `AccountService.esci(token)`. Cancella la sessione. Risposta `204`.

## GET /api/auth/me — #13
Ruoli: autenticato (altrimenti `401`). Service: `AccountService.utenteCorrente(accountId)`.
Aggiorna `ultimaAttivita` come ogni richiesta autenticata. Risposta `200`:
```json
{ "id": 4, "email": "luca.verdi@studenti.unisa.it", "ruolo": "Membro",
  "membro": { "id": 3, "nome": "Luca", "cognome": "Verdi" },
  "organizzazione": { "id": 1, "denominazione": "Università degli Studi di Salerno" } }
```
`id` è l'id dell'Account. Per l'Amministratore `membro` e `organizzazione` sono `null`.
L'organizzazione si legge dal database (join con Organizzazione), senza chiamare OrganizzazioneService.

## GET /api/profilo — #15
Ruoli: Membro. Service: `AccountService.profilo(membroId)`. Risposta `200`:
```json
{ "nome": "Luca", "cognome": "Verdi", "email": "luca.verdi@studenti.unisa.it",
  "organizzazione": { "id": 1, "denominazione": "Università degli Studi di Salerno" },
  "ruoloMobilityManager": false,
  "veicolo": { "id": 1, "modello": "Fiat Panda", "colore": "Bianco", "numeroPostiPasseggeri": 4 },
  "valutazioneMedia": 4.33 }
```
`veicolo` e `valutazioneMedia` sono `null` se assenti.

## POST /api/profilo/veicolo — #15
Ruoli: Membro. Service: `AccountService.registraVeicolo(membroId, dati)`.
Corpo: `{ "modello", "colore", "numeroPostiPasseggeri" }`: `modello` 1–100, `colore` 1–50 caratteri,
`numeroPostiPasseggeri` intero ≥ 1 (400 sul campo). Veicolo già presente → `409` `VEICOLO_GIA_PRESENTE`.
Risposta `201`: il veicolo (`{ "id", "modello", "colore", "numeroPostiPasseggeri" }`).

## DELETE /api/account — #23 · RF_AUTH_07
Ruoli: Membro. Service: `AccountService.eliminaAccount(accountId, password)`.
Corpo: `{ "password" }`; password errata → `400` con `campo: "password"`. Politica di cancellazione:
SDD Sez. 4.1 (riportata nella issue #23). Chiude tutte le sessioni e cancella il cookie. Risposta `204`.

## GET /api/membri?email=… — #14
Ruoli: Amministratore. Service: `AccountService.cercaMembri(email)`: membri il cui indirizzo contiene il
testo indicato (almeno 3 caratteri, altrimenti 400). Risposta `200`:
`[{ "id", "nome", "cognome", "email", "statoAccount", "ruoloMobilityManager", "organizzazione": { "id", "denominazione" } }]`

## PUT /api/membri/:id/ruolo-mm — #14 · RF_ADM_04
Ruoli: Amministratore. Service: `AccountService.assegnaRuoloMobilityManager(membroId)`.
Membro inesistente → `404`; account non `Attivo` → `409` `ACCOUNT_NON_ATTIVO`.
Risposta `200`: `{ "id", "ruoloMobilityManager": true }`.
