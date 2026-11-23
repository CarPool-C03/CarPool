# UC_AUTH_01 Registrare un account

<!-- Copia testuale del caso d'uso del RAD (C03-RAD-ver1.0.0, par. 3.4.2). Se cambia il RAD, si aggiorna questo file nella stessa PR. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_AUTH_01 |
| Nome | Registrare un account |
| Data | 02/11/2026 |
| Versione | 1.0 |
| Autore | Scarico Giovanni |
| Descrizione | Consente a un Visitatore appartenente a un'organizzazione partner di creare un account CarPool con il proprio indirizzo e-mail istituzionale o aziendale e di attivarlo confermando l'indirizzo. |
| Attore principale | Visitatore — obiettivo: Ottenere l’accesso alla comunità verificata della propria organizzazione. |
| Attori secondari | «system» Servizio E-mail — obiettivo: Recapitare il link di verifica all’indirizzo indicato in registrazione. |
| Entry condition | Il caso d’uso inizia quando il Visitatore, non autenticato, richiede la pagina di registrazione della piattaforma. |
| Exit condition on success | Il caso d'uso termina quando l'account si trova nello stato «Attivo» ed è associato all'organizzazione del dominio e-mail: il Visitatore è registrato come Membro e può autenticarsi (UC_AUTH_02). |
| Exit condition on failure | Il caso d’uso termina senza alcun account nello stato «Attivo»: il dominio e-mail non appartiene a un’organizzazione partner, i dati inseriti non sono validi oppure il link di verifica non è valido. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 30/giorno |
| Extension point | – |
| Generalization of | - |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Visitatore | Richiede la registrazione alla piattaforma. |
| 2 | Sistema | Richiede nome, cognome, indirizzo e-mail dell’organizzazione e password. |
| 3 | Visitatore | Inserisce i dati richiesti e ne conferma l’invio. |
| 4 | Sistema | Verifica che i dati obbligatori siano completi e validi e che l’indirizzo e-mail appartenga al dominio di un’organizzazione partner; crea l’account nello stato «In attesa di verifica», genera un link di verifica e ne richiede l’invio al Servizio E-mail. |
| 5 | Servizio E-mail | Recapita il link di verifica all'indirizzo indicato. |
| 6 | Sistema | Informa il Visitatore dell’avvenuto invio del link di verifica. |
| 7 | Visitatore | Apre il link di verifica ricevuto. |
| 8 | Sistema | Valida il link, imposta lo stato dell’account su «Attivo» e conferma l’avvenuta attivazione. |

## Flusso alternativo: Nessuno


## Flusso di errore: Dominio e-mail non autorizzato

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva che il dominio dell’indirizzo e-mail non appartiene ad alcuna organizzazione partner, non crea l’account e segnala l’errore relativo all’indirizzo e-mail |
| 4.a2 | Sistema | Il caso d'uso riprende dal passo 3; se il Visitatore abbandona la registrazione, termina con exit condition on failure |

## Flusso di errore: Dati mancanti, non validi o e-mail già registrata

| Passo | Attore | Azione |
|---|---|---|
| 4.b1 | Sistema | Rileva campi obbligatori mancanti, dati in formato non valido o un indirizzo e-mail già associato a un account, non crea l’account e segnala l’errore relativo a ciascun dato |
| 4.b2 | Sistema | Il caso d’uso riprende dal passo 3 |

## Flusso di errore: Link di verifica non valido

| Passo | Attore | Azione |
|---|---|---|
| 8.a1 | Sistema | Rileva che il link non è valido, mantiene l’account nello stato «In attesa di verifica» e informa il Visitatore. |
| 8.a2 | Sistema | Il caso d’uso termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | SC_CP_01, SC_CP_14 |
| RF collegati | RF_AUTH_01, RF_AUTH_02 |
| Special requirements | RNF_INT_2: invio del link tramite provider di posta esterno. RNF_REL_1: rifiuto del 100% delle registrazioni con domini e-mail non autorizzati. RNF_USA_2: segnalazione degli errori entro 1 secondo. |
