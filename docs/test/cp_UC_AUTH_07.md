# UC_AUTH_07 Eliminare un account — category partition e casi di test

<!-- Specifica dei test del caso d'uso #23, derivata dalla issue e da UC_AUTH_07. La correzione di TC_AUTH_07.06 va riportata nel TCS su Google Drive, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | AccountService.eliminaAccount(accountId, password) e DELETE /api/account (UC_AUTH_07). |
| Requisiti coperti | RF_AUTH_07 |
| Responsabile | Roberto Rega |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Account del Membro | Stato | Attivo [precondizione UC_AUTH_07] |
| Password di conferma | Validità | corretta · errata [error] |
| Account e Membro (ambiente) | Dati personali | valori identificativi presenti [single] |
| Dati associati (ambiente) | Presenza | veicolo, messaggi e valutazioni presenti · assenti |
| Viaggi e richieste (ambiente) | Stato | viaggio attivo con richieste non concluse · viaggio concluso con richieste completate |
| Sessioni (ambiente) | Numero | sessione corrente e altre sessioni presenti · solo sessione corrente |
| Transazione | Esito | commit · errore dopo una scrittura [error] |
| Report PSCL (ambiente, se #21 è nel `main`) | Periodo | report già generato per periodo passato |

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | password errata; dati associati presenti | Cancellazione rifiutata con errore sul campo `password` (4.a1); dati account e associati non cancellati e sessioni ancora valide. |
| TF02 | password corretta; commit | Account «Eliminato» e anonimizzato con i valori proposti in UC_AUTH_07; Membro anonimizzato e ruolo Mobility Manager rimosso (5). |
| TF03 | password corretta; veicolo, messaggio e valutazioni scritte/ricevute presenti; commit | Veicolo, messaggio e valutazioni associati al Membro eliminati (5). |
| TF04 | password corretta; viaggio attivo con richieste non concluse; commit | Viaggio «Cancellato» e richieste non concluse «Annullata» (5). |
| TF05 | password corretta; viaggio concluso e richieste completate; commit | Viaggio concluso e richieste completate conservati; non restano riferimenti personali identificativi (5). |
| TF06 | password corretta; più sessioni presenti; commit | Tutte le sessioni chiuse; login con l'e-mail precedente rifiutato (401 `CREDENZIALI_NON_VALIDE`); login con l'e-mail anonimizzata rifiutato perché Account «Eliminato» (403 `ACCOUNT_NON_ATTIVO`) (5–6). |
| TF07 | password corretta; transazione fallisce dopo una scrittura | Rollback integrale delle modifiche di cancellazione: Account, Membro, dati associati, viaggi e richieste restano allo stato iniziale e le sessioni restano valide; errore 500 (5.a1). |
| TF08 | password corretta; report PSCL passato già generato; #21 presente nel `main` | Il report del periodo passato mantiene gli stessi conteggi dopo la cancellazione. |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_AUTH_07.01 - Eliminazione: password errata, rifiutata | Membro autenticato con veicolo, viaggio e sessioni; invio di una password errata. | Risposta 400 con errore sul campo `password`; Account, Membro e dati associati non sono cancellati e le sessioni restano valide. |
| TC_AUTH_07.02 - Eliminazione: Account e Membro anonimizzati e stato Eliminato | Membro con dati identificativi e ruolo Mobility Manager; invio della password corretta. | Risposta 204; Account nello stato «Eliminato» con e-mail `eliminato+<Account.id>@anonimo.invalid`; Membro con nome «Utente», cognome «Eliminato» e ruolo Mobility Manager false. |
| TC_AUTH_07.03 - Eliminazione: veicolo, messaggi e valutazioni eliminati | Membro con veicolo, messaggio scritto e valutazioni sia scritte sia ricevute; invio della password corretta. | Risposta 204; nessun veicolo, messaggio o valutazione associato al Membro resta. |
| TC_AUTH_07.04 - Eliminazione: viaggi attivi Cancellati e richieste non concluse Annullate | Membro conducente di un viaggio «Attivo» con richieste «InAttesa» e «Accettata»; invio della password corretta. | Risposta 204; viaggio «Cancellato» e richieste «Annullata». |
| TC_AUTH_07.05 - Eliminazione: i viaggi conclusi restano senza riferimenti personali | Membro associato a un viaggio «Concluso» e a richieste «Completata»; invio della password corretta. | Risposta 204; viaggio e richieste restano per i conteggi PSCL e sono collegati solo ai dati anonimizzati, senza dati personali identificativi. |
| TC_AUTH_07.06 - Eliminazione: sessioni chiuse, il login successivo viene rifiutato | Account con più sessioni; cancellazione con password corretta, poi nuovo tentativo di login con le credenziali precedenti e con l'e-mail anonimizzata. | Cancellazione 204; tutte le sessioni non sono più valide; login con l'e-mail precedente rifiutato con 401 `CREDENZIALI_NON_VALIDE` (l'e-mail è stata sostituita da `eliminato+<Account.id>@anonimo.invalid`); login con l'e-mail anonimizzata e la password precedente rifiutato con 403 `ACCOUNT_NON_ATTIVO`. |
| TC_AUTH_07.07 - Eliminazione: il report PSCL di un periodo passato non cambia | Con #21 presente nel `main`, preparare e registrare i conteggi PSCL di un periodo con viaggi conclusi; cancellare un account collegato ai viaggi. | I conteggi del report per quel periodo, prima e dopo la cancellazione, sono identici. |
| TC_AUTH_07.08 - Eliminazione: un errore a metà non lascia modifiche | Account con tutti i dati associati; provocare un errore dopo una scrittura nella transazione di cancellazione. | Risposta 500; nessuna modifica parziale e sessioni valide; lo stato di Account, Membro, dati associati, viaggi e richieste coincide con quello iniziale. |

## Ambiente, procedure speciali e dipendenze

- **Environmental needs**: ambiente comune (`docs/test/ambiente.md`); preparare dati associati e stati di viaggio/richiesta per ciascun caso.
- **Special procedural requirements**: nel test di rollback provocare un errore dopo almeno una scrittura e verificare lo stato completo prima e dopo. Per TC_AUTH_07.07, confrontare i conteggi del report generato prima e dopo la cancellazione; eseguire il caso solo se #21 è nel `main`.
- **Nota sull'oracolo di TC_AUTH_07.06**: dopo l'eliminazione l'e-mail originale non identifica più l'account, perché è stata sostituita da `eliminato+<Account.id>@anonimo.invalid`. Il login con le vecchie credenziali è quindi 401 `CREDENZIALI_NON_VALIDE`, non 403. Il 403 `ACCOUNT_NON_ATTIVO` si osserva solo con l'e-mail anonimizzata.
- **Intercase dependencies**: nessuna; ogni test prepara il proprio stato iniziale.
