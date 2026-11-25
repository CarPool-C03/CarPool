# UC_AUTH_03 Consultare il profilo e registrare il veicolo

| Campo | Valore |
|---|---|
| Identificativo | UC_AUTH_03 |
| Nome | Consultare il profilo e registrare il veicolo |
| Data | 25/11/2026 |
| Versione | 1.0 |
| Autore | Da assegnare |
| Descrizione | Consente al Membro di consultare i propri dati e, se non ha ancora un veicolo associato, registrarne uno. |
| Attore principale | Membro — obiettivo: Consultare il profilo e inserire il veicolo necessario a pubblicare viaggi. |
| Attori secondari | Nessuno |
| Entry condition | Il caso d’uso inizia quando un Membro autenticato richiede il proprio profilo. |
| Exit condition on success | Il caso d’uso termina quando il Membro ha consultato il profilo; se ha registrato un veicolo, questo è associato al suo profilo. |
| Exit condition on failure | Il caso d’uso termina senza registrare un veicolo quando i dati non sono validi o il Membro ne ha già uno. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | Da stimare |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Membro | Richiede la consultazione del proprio profilo. |
| 2 | Sistema | Recupera nome, cognome, e-mail verificata, organizzazione, ruolo Mobility Manager e l'eventuale veicolo; ottiene la valutazione media tramite ComunitaService. |
| 3 | Sistema | Mostra i dati personali e l'organizzazione in sola lettura. Se è presente un veicolo, lo mostra in sola lettura e il caso d'uso termina con exit condition on success; altrimenti consente di inserire i dati del veicolo. |
| 4 | Membro | Inserisce modello, colore e numero di posti passeggeri, conducente escluso, e conferma. |
| 5 | Sistema | Valida i dati e registra il veicolo associandolo al Membro. |
| 6 | Sistema | Conferma la registrazione e mostra il veicolo in sola lettura; il caso d'uso termina con exit condition on success. |

## Flusso alternativo: Consultazione senza inserimento

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Membro | Non inserisce un veicolo e termina la consultazione. |
| 4.a2 | Sistema | Non modifica i dati; il caso d'uso termina con exit condition on success. |

## Flusso di errore: Dati del veicolo non validi

| Passo | Attore | Azione |
|---|---|---|
| 5.a1 | Sistema | Rileva modello o colore mancanti o fuori limite, oppure posti passeggeri non interi o inferiori a 1; non registra il veicolo e segnala l'errore sul relativo campo. |
| 5.a2 | Sistema | Il caso d'uso riprende dal passo 4; se il Membro abbandona, termina con exit condition on failure. |

## Flusso di errore: Veicolo già registrato

| Passo | Attore | Azione |
|---|---|---|
| 5.b1 | Sistema | Rileva che il Membro ha già un veicolo, non ne registra un secondo e segnala il conflitto. |
| 5.b2 | Sistema | Il caso d'uso termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | – |
| RF collegati | RF_AUTH_08, RF_AUTH_12 |
| Special requirements | RNF_USA_2: gli errori sono mostrati accanto al campo non valido entro 1 secondo. |
