# UC_ADM_04 Assegnare il ruolo di Mobility Manager — category partition e casi di test

<!-- BOZZA per C03-58 (#14), derivata da docs/rad/uc/UC_ADM_04.md. Da riportare nel TCS (C03-TCS)
     su Google Drive: se cambia qui, si aggiorna anche il TCS, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | AccountService: cercaMembri(email) per i passi 3-4 (`GET /api/membri?email=…`) e assegnaRuoloMobilityManager(membroId) per i passi 7-8 (`PUT /api/membri/:id/ruolo-mm`); la conferma dei passi 6-7 è della pagina «Membri e ruoli» (L5). Nessun sequence diagram: l'ordine delle chiamate è nel piano del task. |
| Requisiti coperti | RF_ADM_04 |
| Responsabile | Gennaro Garone, Roberto Rega |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Testo di ricerca | Lunghezza | almeno 3 caratteri · meno di 3 caratteri [error] |
| Membri corrispondenti (ambiente) | Numero | nessuno [error] · uno · più di uno [single] |
| Account del Membro selezionato (ambiente) | Stato (SCD_CP_01) | Attivo · In attesa di verifica [error] · Eliminato [error] |
| Conferma | Risposta dell'Amministratore | conferma · non conferma [single] |

Con i vincoli si ottengono 7 test frame: 4 di errore, 2 singoli e 1 combinazione dei valori restanti.

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | testo di meno di 3 caratteri | Nessun elenco; errore sull'indirizzo e-mail (4.a1); ripresa dal passo 3. |
| TF02 | nessun Membro corrispondente | Elenco vuoto; Amministratore informato (4.b1); ripresa dal passo 3. |
| TF03 | più Membri corrispondenti | Elenco di tutti e soli i Membri corrispondenti, con stato, ruolo e organizzazione. |
| TF04 | account «In attesa di verifica», conferma | Ruolo non assegnato; errore «account non attivo» (8.a1); ripresa dal passo 5. |
| TF05 | account «Eliminato», conferma | Ruolo non assegnato; errore «account non attivo» (8.a1). |
| TF06 | account «Attivo», non conferma | Ruolo invariato (7.a1); nessuna richiesta di assegnazione. |
| TF07 | un Membro, account «Attivo», conferma | Ruolo di Mobility Manager assegnato; stato dell'account invariato; exit on success. |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_ADM_04.01 | Ricerca «sa». | Errore sul campo `email`; nessun elenco. |
| TC_ADM_04.02 | Ricerca «nessuno.qui». | Elenco vuoto. |
| TC_ADM_04.03 | Ricerca «studenti.unisa.it». | Elenco dei 5 Membri di prova, ciascuno con `statoAccount` «Attivo», `ruoloMobilityManager` (vero solo per Paolo Neri) e organizzazione «Università degli Studi di Salerno»; nessun account Amministratore. |
| TC_ADM_04.04 | Ambiente: Membro Mario Rossi (mario.rossi@studenti.unisa.it) con account «In attesa di verifica». Input: assegnazione del ruolo a Mario Rossi. | Errore `ACCOUNT_NON_ATTIVO`; `ruoloMobilityManager` di Mario Rossi falso; stato invariato. |
| TC_ADM_04.05 | Ambiente: Membro con account «Eliminato» (dati anonimizzati). Input: assegnazione del ruolo a quel Membro. | Errore `ACCOUNT_NON_ATTIVO`; ruolo non assegnato; stato «Eliminato» invariato. |
| TC_ADM_04.06 | Ricerca «sara.galli», selezione di Sara Galli, assegnazione non confermata (test della pagina). | Nessuna richiesta di assegnazione inviata; Sara Galli resta senza ruolo. |
| TC_ADM_04.07 | Ricerca «sara.galli»; assegnazione del ruolo a Sara Galli. | `ruoloMobilityManager` di Sara Galli vero; account ancora «Attivo»; al login successivo Sara Galli ha il ruolo MobilityManager. |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`), con indirizzi dei Membri di prova nella
forma nome.cognome@studenti.unisa.it, più un account Amministratore di prova (amministratore@carpool.example,
«Attivo», senza Membro) autenticato in ogni caso di test; per TC_ADM_04.04 e TC_ADM_04.05 i Membri indicati.

**Special procedural requirements**: TC_ADM_04.06 è un test del frontend (pagina «Membri e ruoli»): controlla
che senza conferma non parta la richiesta. Membro inesistente (404) e accesso di un Membro (403) sono test
dell'issue, non di questo TCS. RNF_USA_2 si verifica nei test di sistema.

**Intercase dependencies**: nessuna: ogni caso di test prepara il proprio stato.
