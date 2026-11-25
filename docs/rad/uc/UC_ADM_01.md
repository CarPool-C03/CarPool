# UC_ADM_01 Registrare un'organizzazione partner

<!-- BOZZA per C03-58 (#14), scritta dai requisiti (RF_ADM_01, RNF_SUP_2), da docs/api/organizzazioni.md
     e da docs/sdd/README.md (DG_13). Da confrontare con il RAD (par. 3.4.2) e riportare nel RAD:
     se il RAD cambia, si aggiorna questo file nella stessa PR. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_ADM_01 |
| Nome | Registrare un'organizzazione partner |
| Data | 25/11/2026 |
| Versione | 0.1 (bozza) |
| Autore | Garone Gennaro, Rega Roberto |
| Descrizione | Consente all'Amministratore di registrare un'organizzazione partner con la sua denominazione, le sue sedi e i domini e-mail autorizzati, così che i membri dell'organizzazione possano registrarsi alla piattaforma. |
| Attore principale | Amministratore — obiettivo: Aggiungere un'organizzazione partner alla piattaforma e abilitarne i domini e-mail alla registrazione. |
| Attori secondari | Nessuno |
| Entry condition | Il caso d'uso inizia quando l'Amministratore, autenticato, richiede la registrazione di una nuova organizzazione partner. |
| Exit condition on success | Il caso d'uso termina quando l'organizzazione è registrata come attiva con tutte le sue sedi e tutti i suoi domini e-mail, e i suoi domini sono riconosciuti nelle registrazioni degli account (UC_AUTH_01) senza modifiche al codice né interruzione del servizio. |
| Exit condition on failure | Il caso d'uso termina senza alcuna organizzazione, sede o dominio registrati: i dati inseriti sono mancanti o non validi, oppure un dominio è già usato da un'altra organizzazione, e l'Amministratore abbandona la registrazione. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 1/mese |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Amministratore | Richiede la registrazione di una nuova organizzazione partner. |
| 2 | Sistema | Richiede la denominazione, una o più sedi, ciascuna con nome e indirizzo, e uno o più domini e-mail autorizzati. |
| 3 | Amministratore | Inserisce i dati richiesti e ne conferma l'invio. |
| 4 | Sistema | Verifica che la denominazione sia presente e non superi 200 caratteri, che ci sia almeno una sede con nome (fino a 200 caratteri) e indirizzo (fino a 300 caratteri), che ci sia almeno un dominio nella forma `nome.dominio`, senza `@` e non ripetuto, e che nessun dominio sia già usato da un'altra organizzazione; registra in un'unica operazione l'organizzazione come attiva, le sue sedi e i suoi domini, salvati in minuscolo. |
| 5 | Sistema | Conferma l'avvenuta registrazione e presenta l'organizzazione con le sue sedi e i suoi domini; da questo momento accetta le registrazioni degli account con i domini dell'organizzazione. |

## Flusso alternativo: Nessuno

## Flusso di errore: Dati mancanti o non validi

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva la denominazione mancante o troppo lunga, nessuna sede, una sede senza nome o senza indirizzo, nessun dominio, oppure un dominio in forma non valida o ripetuto; non registra nulla e segnala l'errore relativo a ciascun dato. |
| 4.a2 | Sistema | Il caso d'uso riprende dal passo 3; se l'Amministratore abbandona, termina con exit condition on failure. |

## Flusso di errore: Dominio già usato da un'altra organizzazione

| Passo | Attore | Azione |
|---|---|---|
| 4.b1 | Sistema | Rileva che almeno un dominio è già associato a un'altra organizzazione; non registra né l'organizzazione né le sue sedi né i suoi domini e segnala l'errore relativo a quel dominio. |
| 4.b2 | Sistema | Il caso d'uso riprende dal passo 3; se l'Amministratore abbandona, termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | Da indicare dal RAD |
| RF collegati | RF_ADM_01 |
| Special requirements | RNF_SUP_2: i domini autorizzati si aggiornano senza modifiche al codice né interruzione del servizio (DG_13: il riconoscimento del dominio legge il database a ogni registrazione). RNF_USA_2: un messaggio per ogni campo non valido entro 1 secondo. |
