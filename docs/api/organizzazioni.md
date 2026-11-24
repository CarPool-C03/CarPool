# API: organizzazioni partner

Convenzioni ed errori comuni: [README.md](README.md). Sottosistema: `organizzazioni`
(OrganizzazioneService). Endpoint `/api/organizzazioni`: ruolo **Amministratore** (RF_ADM_01).

Formato di un'organizzazione nelle risposte:
```json
{ "id": 1, "denominazione": "Università degli Studi di Salerno", "attiva": true,
  "sedi": [{ "id": 1, "nome": "Campus di Fisciano", "indirizzo": "Via Giovanni Paolo II, 132" }],
  "domini": ["studenti.unisa.it", "unisa.it"] }
```

## POST /api/organizzazioni — #14 · RF_ADM_01
Service: `OrganizzazioneService.registraOrganizzazione(dati)`, in un'unica transazione.

Corpo: `{ "denominazione", "sedi": [{ "nome", "indirizzo" }], "domini": ["…"] }`

| Campo | Regola | Errore 400 sul campo |
|---|---|---|
| `denominazione` | obbligatoria, 1–200 caratteri | mancante o troppo lunga |
| `sedi` | almeno una; `nome` 1–200, `indirizzo` 1–300 caratteri | `sedi`, oppure `sedi[i].nome` / `sedi[i].indirizzo` |
| `domini` | almeno uno; forma `nome.dominio` senza `@`, salvato in minuscolo; non ripetuto | `domini`, oppure `domini[i]` |
| `domini[i]` | non già usato da un'altra organizzazione | `domini[i]`: «dominio già usato da un'altra organizzazione» |

Risposta `201`: l'organizzazione creata.

## GET /api/organizzazioni — #14
Service: `OrganizzazioneService.elencoOrganizzazioni()`. Risposta `200`: elenco di organizzazioni,
ordinato per `denominazione`.

## GET /api/organizzazioni/:id — #14
Service: `OrganizzazioneService.dettaglioOrganizzazione(id)`. Inesistente → `404`.
Risposta `200`: l'organizzazione.

## GET /api/sedi — #14
Ruoli: Membro. Service: `OrganizzazioneService.sediOrganizzazione(organizzazioneId)` con l'organizzazione
del Membro autenticato. Risposta `200`: `[{ "id", "nome", "indirizzo" }]`, ordinate per `nome`.
Serve ai moduli di pubblicazione (#16), ricerca (#17) e report (#21).

## Funzioni usate da altri sottosistemi (non sono endpoint)

- `OrganizzazioneService.riconosciDominio(email)` → `{ id, denominazione }` dell'organizzazione **attiva**
  che possiede il dominio dell'e-mail, oppure `null`. Legge il database a ogni chiamata (DG_13). Usata da
  #12; va fatta **per prima** in #14.
- `OrganizzazioneService.sediOrganizzazione(organizzazioneId)` → `[{ id, nome, indirizzo }]`. Usata da
  `GET /api/sedi` e dai controlli «la sede appartiene all'organizzazione» di #16, #17, #21.
