# UC_AUTH_07 Eliminare un account

<!-- Definizione testuale del caso d'uso #23, derivata dalla specifica approvata. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_AUTH_07 |
| Nome | Eliminare un account |
| Data | 26/11/2026 |
| Versione | 1.0 |
| Autore | Roberto Rega |
| Descrizione | Consente a un Membro con Account «Attivo» e autenticato di cancellare il proprio profilo e i dati associati, confermando l'operazione con la password. |
| Attore principale | Membro — obiettivo: cancellare il proprio account e i dati associati. |
| Attori secondari | Nessuno |
| Entry condition | Il caso d'uso inizia quando un Membro con Account «Attivo» e autenticato richiede la cancellazione del proprio account. Un Account «In attesa di verifica» non può autenticarsi e non può avviare UC_AUTH_07. |
| Exit condition on success | L'Account è nello stato «Eliminato», Account e Membro sono anonimizzati, i dati previsti dalla politica sono cancellati o aggiornati, tutte le sessioni sono chiuse e il Membro è riportato alla pagina iniziale. |
| Exit condition on failure | Il caso d'uso termina senza modifiche persistenti se la password non è corretta o se la transazione fallisce. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | Non specificata; operazione su richiesta |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Membro | Richiede la cancellazione del proprio account. |
| 2 | Sistema | Richiede nuovamente la password per confermare l'identità. |
| 3 | Membro | Inserisce la password. |
| 4 | Sistema | Verifica la password. |
| 5 | Sistema | In un'unica transazione anonimizza Account e Membro e imposta Account nello stato «Eliminato»; elimina veicolo, messaggi e valutazioni scritte o ricevute; imposta «Cancellato» sui viaggi attivi e «Annullata» sulle richieste non concluse; conserva i viaggi conclusi senza riferimenti personali; chiude tutte le sessioni. |
| 6 | Sistema | Conferma l'operazione con risposta 204 e cancella il cookie di sessione. |
| 7 | Sistema | Il frontend riporta il Membro alla pagina iniziale. |

## Flusso alternativo: Nessuno

## Flusso di errore: Password non corretta

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva che la password non è corretta, non avvia la cancellazione e segnala l'errore sul campo `password` (400). |
| 4.a2 | Sistema | Il caso d'uso riprende dal passo 3; se il Membro abbandona, termina con exit condition on failure. |

## Flusso di errore: Errore durante la cancellazione

| Passo | Attore | Azione |
|---|---|---|
| 5.a1 | Sistema | Rileva un errore durante la transazione, annulla tutte le modifiche della transazione e segnala un errore interno (500); le sessioni restano valide. |
| 5.a2 | Sistema | Il caso d'uso termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | – |
| RF collegati | RF_AUTH_07 |
| Special requirements | La cancellazione e l'anonimizzazione sono atomiche (SDD, Sez. 4.1). Valori proposti per l'anonimizzazione: `Account.email = eliminato+<Account.id>@anonimo.invalid`, `Membro.nome = Utente`, `Membro.cognome = Eliminato`, `Membro.ruoloMobilityManager = false`. Gli identificativi tecnici necessari ai viaggi conclusi possono restare, ma non devono consentire di risalire ai dati personali. I viaggi conclusi e le richieste completate restano per non alterare i conteggi aggregati PSCL. |
