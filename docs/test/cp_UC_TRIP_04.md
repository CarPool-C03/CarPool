# UC_TRIP_04 Gestire i propri viaggi pubblicati — category partition e casi di test

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | ViaggioPrenotazioneService: `viaggiDelConducente`, `modificaViaggio`, `cancellaViaggio` |
| Requisiti coperti | RF_TRIP_04, RF_TRIP_05, RF_TRIP_16, RF_TRIP_18, RF_TRIP_24 |
| Responsabile | Michele Vitiello, Gennaro Garone |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Operazione | Tipo | consultazione · modifica · cancellazione |
| Viaggio (consultazione) | Stato | «Attivo» · «Concluso» · «Cancellato» [excluded] |
| Elenco | Presenza | nessun viaggio · viaggi attivi · viaggi conclusi · entrambi |
| Elenco | Ordinamento | attivi per partenza crescente · conclusi per partenza decrescente |
| Richieste ricevute | Stato | «InAttesa» · «Accettata» · «Rifiutata» · «Annullata» · «Completata» |
| Viaggio (modifica/cancellazione) | Proprietà | Conducente proprietario · altro Membro [error] · inesistente [error] |
| Viaggio (modifica/cancellazione) | Stato | «Attivo» · «Concluso» [error] · «Cancellato» [error] |
| Viaggio (modifica) | Richieste «Accettata» | nessuna · almeno una [error] |
| Dati di modifica | Validità | validi · almeno un campo mancante o non valido [error] |
| Notifica modifica | Richieste destinatarie | «InAttesa» · nessuna «InAttesa» · altri stati soltanto |
| Cancellazione | Richieste presenti | nessuna · «InAttesa» · «Accettata» · entrambe · altri stati soltanto |
| Notifica cancellazione | Stato della richiesta | «InAttesa»/«Accettata» [notifica] · «Rifiutata»/«Annullata»/«Completata» [no notifica] |
| Cancellazione | Esito transazione | commit · errore prima del commit [error] |
| Notifica (modifica/cancellazione) | Invio | inoltrato · fallito (operazione confermata, errore registrato) |

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | consultazione; viaggi attivi e conclusi; richieste in stati diversi | Elenchi separati, richieste con Passeggero e stato; attivi crescenti e conclusi decrescenti per partenza. |
| TF02 | consultazione; viaggio «Cancellato» | Il viaggio non compare. |
| TF03 | consultazione; nessun viaggio | Elenchi attivi e conclusi vuoti; consultazione riuscita. |
| TF04 | modifica; proprietario; «Attivo»; nessuna richiesta «Accettata»; dati validi; richiesta «InAttesa» | Dettagli aggiornati; notifica RF_TRIP_18 inoltrata al Passeggero dopo il salvataggio. |
| TF05 | modifica; richiesta «Accettata» presente | Nessuna modifica; `VIAGGIO_CON_PRENOTAZIONI_ACCETTATE` (409). |
| TF06 | modifica; viaggio «Concluso» o «Cancellato» | Nessuna modifica; `VIAGGIO_NON_ATTIVO` (409). |
| TF07 | modifica; altro Membro proprietario assente | Nessuna modifica; `NON_AUTORIZZATO` (403). |
| TF08 | modifica; dati mancanti o non validi | Nessuna modifica; errore 400 sul campo non valido. |
| TF09 | cancellazione; proprietario; «Attivo»; richieste «InAttesa» e «Accettata» | Viaggio «Cancellato», richieste «Annullata» nella stessa transazione; notifica RF_TRIP_16 inoltrata dopo il commit, quando gli stati aggiornati sono visibili. |
| TF10 | cancellazione; proprietario; «Attivo»; nessuna richiesta annullabile | Viaggio «Cancellato»; richieste con altri stati invariate. |
| TF11 | cancellazione; viaggio «Concluso» o «Cancellato» | Nessuna modifica; `VIAGGIO_NON_ATTIVO` (409). |
| TF12 | modifica e cancellazione; altro Membro | Entrambe le operazioni rifiutate con 403; nessuna modifica. |
| TF13 | cancellazione; errore prima del commit | Rollback: viaggio e richieste conservano gli stati iniziali. |
| TF14 | cancellazione; #17 presente in `main` / assente da `main` | Se #17 è presente, il viaggio cancellato non compare nella ricerca; altrimenti resta verificabile con stato «Cancellato». |
| TF15 | frontend; viaggio con richiesta «Accettata» | «Modifica» disattivato. |
| TF16 | modifica/cancellazione; invio e-mail fallito | Modifica o cancellazione resta confermata; il fallimento d'invio non annulla lo stato e viene registrato secondo l'ODD. |
| TF17 | cancellazione; richieste in tutti gli stati | Notifica inviata solo ai Passeggeri con richiesta `InAttesa` o `Accettata`, una volta per richiesta annullata e dopo il commit. |
| TF18 | cancellazione; provider rifiuta l'invio | Viaggio e richieste restano aggiornati; errore `INVIO_EMAIL_FALLITO` registrato, senza rollback. |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_TRIP_04.01 | Conducente con viaggi «Attivo» e «Concluso», richieste in stati diversi; consulta l'elenco. | Viaggi separati, richieste con Passeggero e stato; attivi ordinati per partenza crescente e conclusi decrescenti. |
| TC_TRIP_04.02 | Il Conducente ha anche un viaggio «Cancellato». | Il viaggio «Cancellato» non compare nell'elenco. |
| TC_TRIP_04.03 | Conducente senza viaggi consultabili. | Risposta valida con elenchi attivi e conclusi vuoti. |
| TC_TRIP_04.04 | Viaggio «Attivo» proprio, nessuna richiesta «Accettata», dati validi e richiesta «InAttesa». Modifica il viaggio. | Dati aggiornati; la notifica RF_TRIP_18 con i dati aggiornati è inoltrata al Passeggero dopo il salvataggio. |
| TC_TRIP_04.05 | Viaggio «Attivo» proprio con una richiesta «Accettata». Tenta la modifica. | 409 `VIAGGIO_CON_PRENOTAZIONI_ACCETTATE`; dettagli invariati. |
| TC_TRIP_04.06 | Viaggio proprio in stato «Concluso» e, separatamente, «Cancellato». Tenta la modifica. | 409 `VIAGGIO_NON_ATTIVO`; dettagli invariati. |
| TC_TRIP_04.07 | Un altro Membro tenta di modificare e cancellare un viaggio esistente. | Entrambe le operazioni rispondono 403 `NON_AUTORIZZATO`; viaggio e richieste invariati. |
| TC_TRIP_04.08 | Viaggio «Attivo» proprio; dati di modifica mancanti o non validi, ad esempio data non futura o posti oltre quelli del veicolo. | 400 con errore sul campo; nessun dato aggiornato. |
| TC_TRIP_04.09 | Viaggio «Attivo» proprio con richieste «InAttesa» e «Accettata». Cancella il viaggio. | Viaggio «Cancellato» e richieste «Annullata» nella stessa transazione; RF_TRIP_16 inoltrata dopo il commit, con gli stati aggiornati visibili all'observer. |
| TC_TRIP_04.10 | Viaggio «Attivo» proprio senza richieste «InAttesa» o «Accettata». Cancella il viaggio. | Viaggio «Cancellato»; eventuali richieste in altri stati restano invariate. |
| TC_TRIP_04.11 | Viaggio proprio «Concluso» e, separatamente, «Cancellato». Tenta la cancellazione. | 409 `VIAGGIO_NON_ATTIVO`; stati invariati. |
| TC_TRIP_04.12 | Un errore viene provocato durante la transazione di cancellazione. | La transazione esegue rollback; viaggio e richieste hanno gli stati iniziali. |
| TC_TRIP_04.13 | Cancella un viaggio «Attivo» e verifica la ricerca. | Se #17 è in `main`, il viaggio non compare nei risultati; altrimenti il suo stato persistito è «Cancellato». |
| TC_TRIP_04.14 | La pagina mostra un viaggio con una richiesta «Accettata». | Il controllo «Modifica» è disattivato. |
| TC_TRIP_04.15 | Invio RF_TRIP_18 o RF_TRIP_16 non riuscito dopo il salvataggio/commit. | Stato aggiornato invariato; il fallimento d'invio non annulla la modifica/cancellazione ed è registrato secondo l'ODD. |
| TC_TRIP_04.16 | Un viaggio «Attivo» ha richieste «InAttesa», «Accettata», «Rifiutata», «Annullata» e «Completata» di Passeggeri distinti. Cancella il viaggio. | RF_TRIP_16 è inoltrata solo ai Passeggeri con richiesta «InAttesa» o «Accettata», dopo il commit. |
| TC_TRIP_04.17 | Il provider rifiuta l'invio della notifica RF_TRIP_16 dopo il commit. | Viaggio «Cancellato» e richieste annullabili «Annullata» restano persistiti; l'errore `INVIO_EMAIL_FALLITO` è registrato. |

I test della issue corrispondono a TC_TRIP_04.01, .05, .06, .07, .09, .13, .14, .16 e .17.

## Ambiente, procedure speciali e dipendenze

- **Environmental needs**: ambiente comune (`docs/test/ambiente.md`); preparare Conducente, altro Membro, viaggi e richieste isolati per ciascun test.
- **Special procedural requirements**: nel test TC_TRIP_04.12 predisporre un errore interno alla transazione; usare lo stub del Servizio E-mail per verificare destinatari ed esiti d'invio.
- **Intercase dependencies**: nessuna; ogni test prepara il proprio stato. TC_TRIP_04.13 verifica la ricerca solo se #17 è presente in `main`.
