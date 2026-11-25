# UC_TRIP_03 Gestire le richieste di prenotazione — category partition e casi di test

<!-- Nuovo caso d'uso del Passeggero; i test automatici includono l'identificativo TC. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | ViaggioPrenotazioneService: inviaRichiesta, richiesteDelPasseggero, annullaRichiesta |
| Requisiti coperti | RF_TRIP_06, RF_TRIP_14, RF_TRIP_23a, RF_TRIP_23b |
| Responsabile | Vladyslav Maslov, Roberto Rega |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Operazione | Tipo | invio · consultazione · annullamento |
| Viaggio (invio) | Stato | «Attivo» · «Cancellato» [error] · «Concluso» [error] |
| Viaggio (invio) | Conducente | altro Membro · Passeggero [error] |
| Viaggio (invio) | Posti disponibili | almeno 1 · 0 |
| Richiesta attiva preesistente | Stato | nessuna · «In attesa» [error] · «Accettata» [error] |
| Richiesta da annullare | Stato | «In attesa» · «Accettata» · «Rifiutata» [error] · «Annullata» [error] · «Completata» [error] |
| Viaggio (annullamento) | Stato | non concluso · «Concluso» [error] |
| Richiesta da annullare | Proprietà | Passeggero proprietario · altro Passeggero [error] |
| Elenco richieste | Stato presente | «In attesa» · «Accettata» · «Rifiutata» · «Annullata» · «Completata» |

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | invio; viaggio «Attivo» di altro Membro; posti disponibili; nessuna richiesta attiva | Richiesta registrata «In attesa». |
| TF02 | invio; viaggio «Attivo» di altro Membro; zero posti; nessuna richiesta attiva | Richiesta registrata «In attesa»; i posti disponibili non sono prenotati. |
| TF03 | invio; viaggio proprio | Richiesta non creata; `VIAGGIO_PROPRIO`. |
| TF04 | invio; viaggio «Cancellato» o «Concluso» | Richiesta non creata; `VIAGGIO_NON_ATTIVO`. |
| TF05 | invio; viaggio «Attivo»; richiesta attiva preesistente «In attesa» o «Accettata» | Richiesta duplicata non creata; `RICHIESTA_GIA_PRESENTE`. |
| TF06 | consultazione; elenco con più stati | Ogni richiesta mostra stato e dati del viaggio; ordinamento per partenza decrescente. |
| TF07 | annullamento; richiesta «In attesa»; viaggio non concluso | Stato «Annullata»; posti disponibili invariati. |
| TF08 | annullamento; richiesta «Accettata»; viaggio non concluso | Stato «Annullata»; posti disponibili aumentati di uno. |
| TF09 | annullamento; viaggio «Concluso» | Stato invariato; `VIAGGIO_CONCLUSO`. |
| TF10 | pagina Le mie prenotazioni; richieste in stati diversi | Stato mostrato; «Annulla» disponibile per richieste «In attesa» o «Accettata» di viaggi non conclusi. |
| TF11 | annullamento; richiesta di un altro Passeggero | Stato invariato; `NON_AUTORIZZATO`. |
| TF12 | annullamento; richiesta «Rifiutata», «Annullata» o «Completata» | Stato invariato; `RICHIESTA_NON_ANNULLABILE`. |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_TRIP_03.01 | Viaggio «Attivo», posti disponibili, nessuna richiesta attiva. Invia richiesta. | Richiesta creata nello stato «In attesa». |
| TC_TRIP_03.02 | Viaggio «Attivo», zero posti disponibili, nessuna richiesta attiva. Invia richiesta. | Richiesta creata nello stato «In attesa». |
| TC_TRIP_03.03 | Passeggero invia richiesta per un proprio viaggio «Attivo». | Errore `VIAGGIO_PROPRIO`; nessuna richiesta creata. |
| TC_TRIP_03.04 | Passeggero invia richiesta per un viaggio «Cancellato» o «Concluso». | Errore `VIAGGIO_NON_ATTIVO`; nessuna richiesta creata. |
| TC_TRIP_03.05 | Esiste già una richiesta «In attesa» o «Accettata» dello stesso Passeggero per il viaggio. | Errore `RICHIESTA_GIA_PRESENTE`; nessun duplicato creato. |
| TC_TRIP_03.06 | Passeggero consulta richieste con stati e viaggi differenti. | Elenco con stati e dati del viaggio, ordinato per partenza decrescente. |
| TC_TRIP_03.07 | Passeggero annulla una propria richiesta «In attesa» per un viaggio non concluso. | Stato «Annullata»; posti disponibili invariati. |
| TC_TRIP_03.08 | Passeggero annulla una propria richiesta «Accettata» per un viaggio non concluso. | Stato «Annullata»; posti disponibili aumentati di uno. |
| TC_TRIP_03.09 | Passeggero annulla una propria richiesta per un viaggio «Concluso». | Errore `VIAGGIO_CONCLUSO`; richiesta invariata. |
| TC_TRIP_03.10 | La pagina mostra richieste annullabili e non annullabili con i relativi stati. | Badge di stato visibile; «Annulla» solo per «In attesa» o «Accettata» su viaggio non concluso. |
| TC_TRIP_03.11 | Un altro Passeggero tenta di annullare una richiesta. | Errore 403; richiesta invariata. |
| TC_TRIP_03.12 | Il Passeggero tenta di annullare una richiesta «Rifiutata», «Annullata» o «Completata». | Errore `RICHIESTA_NON_ANNULLABILE`; richiesta invariata. |

I test richiesti dall'issue corrispondono a TC_TRIP_03.01, .03, .04, .05, .06, .08, .09 e .10.

## Ambiente, procedure speciali e dipendenze

- **Environmental needs**: ambiente comune (`docs/test/ambiente.md`); preparare Passeggero, Conducente e viaggi isolati per ciascun test.
- **Special procedural requirements**: nel test TC_TRIP_03.02 predisporre un viaggio con zero posti disponibili, senza richieste attive del Passeggero.
- **Intercase dependencies**: nessuna; ogni test prepara il proprio stato.
