# UC_ADM_04 Assegnare il ruolo di Mobility Manager

<!-- BOZZA per C03-58 (#14), scritta dai requisiti (RF_ADM_04), da docs/api/account.md (membri e ruolo),
     da docs/rad/mockup/README.md (Membri e ruoli) e da SCD_CP_01 (stati dell'Account).
     Da confrontare con il RAD (par. 3.4.2) e riportare nel RAD: se il RAD cambia, si aggiorna
     questo file nella stessa PR. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_ADM_04 |
| Nome | Assegnare il ruolo di Mobility Manager |
| Data | 25/11/2026 |
| Versione | 0.1 (bozza) |
| Autore | Garone Gennaro, Rega Roberto |
| Descrizione | Consente all'Amministratore di cercare un Membro per indirizzo e-mail e di assegnargli il ruolo di Mobility Manager della sua organizzazione partner, abilitandolo alla generazione dei report PSCL (UC_ORG_01). |
| Attore principale | Amministratore — obiettivo: Nominare il Mobility Manager di un'organizzazione partner. |
| Attori secondari | Nessuno |
| Entry condition | Il caso d'uso inizia quando l'Amministratore, autenticato, richiede la gestione dei ruoli dei Membri. |
| Exit condition on success | Il caso d'uso termina quando il Membro selezionato, con account nello stato «Attivo», ha il ruolo di Mobility Manager; lo stato del suo account non cambia. |
| Exit condition on failure | Il caso d'uso termina senza alcun ruolo assegnato: il testo di ricerca non è valido, nessun Membro corrisponde alla ricerca, l'account del Membro selezionato non è nello stato «Attivo», oppure l'Amministratore non conferma l'assegnazione. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 2/mese |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Amministratore | Richiede la gestione dei ruoli dei Membri. |
| 2 | Sistema | Richiede l'indirizzo e-mail, anche parziale, del Membro da cercare. |
| 3 | Amministratore | Inserisce il testo di ricerca e ne conferma l'invio. |
| 4 | Sistema | Verifica che il testo contenga almeno 3 caratteri e presenta i Membri il cui indirizzo e-mail lo contiene, ciascuno con nome, cognome, indirizzo e-mail, stato dell'account, ruolo e organizzazione. |
| 5 | Amministratore | Seleziona un Membro e richiede l'assegnazione del ruolo di Mobility Manager. |
| 6 | Sistema | Chiede di confermare l'assegnazione, indicando il Membro e la sua organizzazione. |
| 7 | Amministratore | Conferma l'assegnazione. |
| 8 | Sistema | Verifica che l'account del Membro sia nello stato «Attivo», gli assegna il ruolo di Mobility Manager e conferma l'avvenuta assegnazione. |

## Flusso alternativo: Assegnazione non confermata

| Passo | Attore | Azione |
|---|---|---|
| 7.a1 | Amministratore | Non conferma l'assegnazione. |
| 7.a2 | Sistema | Non modifica il ruolo del Membro; il caso d'uso riprende dal passo 5; se l'Amministratore abbandona, termina con exit condition on failure. |

## Flusso di errore: Testo di ricerca non valido

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva un testo di ricerca con meno di 3 caratteri e segnala l'errore relativo all'indirizzo e-mail. |
| 4.a2 | Sistema | Il caso d'uso riprende dal passo 3; se l'Amministratore abbandona, termina con exit condition on failure. |

## Flusso di errore: Nessun Membro corrispondente

| Passo | Attore | Azione |
|---|---|---|
| 4.b1 | Sistema | Rileva che nessun Membro ha un indirizzo e-mail che contiene il testo indicato e ne informa l'Amministratore. |
| 4.b2 | Sistema | Il caso d'uso riprende dal passo 3; se l'Amministratore abbandona, termina con exit condition on failure. |

## Flusso di errore: Account non attivo

| Passo | Attore | Azione |
|---|---|---|
| 8.a1 | Sistema | Rileva che l'account del Membro è nello stato «In attesa di verifica» o «Eliminato», non assegna il ruolo e segnala che l'account non è attivo. |
| 8.a2 | Sistema | Il caso d'uso riprende dal passo 5; se l'Amministratore abbandona, termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | Da indicare dal RAD |
| RF collegati | RF_ADM_04 |
| Special requirements | RNF_USA_2: segnalazione degli errori entro 1 secondo. |
