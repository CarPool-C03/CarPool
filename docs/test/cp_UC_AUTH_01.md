# UC_AUTH_01 Registrare un account — category partition e casi di test

<!-- Copia testuale del paragrafo 4.1 del TCS (C03-TCS-ver0.2.0). Se cambia qui, si aggiorna anche il TCS su Google Drive, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | RegistraAccountControl: registra(dati) per i passi 3-6 e verificaLink(link) per i passi 7-8 (SD_CP_01). |
| Requisiti coperti | RF_AUTH_01, RF_AUTH_02 |
| Responsabile | Giovanni Scarico |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Dati obbligatori (nome, cognome, e-mail, password) | Completezza | completi · almeno uno mancante [error] |
| Dati inseriti | Formato | validi · almeno un dato in formato non valido [error] |
| Indirizzo e-mail | Dominio | di un'organizzazione partner · di nessuna organizzazione partner [error] |
| Indirizzo e-mail (ambiente) | Associazione a un account | non associato · già associato a un account [error] |
| Link di verifica | Validità | valido · non valido [error] |
| Invio del link di verifica | Esito di NotificaService.inviaLinkVerifica | true · false [error] |

Con i vincoli [error] si ottengono 7 test frame: 6 di errore e 1 combinazione dei valori restanti.

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | dati mancanti | Nessun account creato; errore sul dato mancante (4.b1); ripresa dal passo 3. |
| TF02 | dati completi, formato non valido | Nessun account creato; errore sul dato non valido (4.b1). |
| TF03 | dati validi, dominio non partner | Nessun account creato; errore sull'indirizzo e-mail (4.a1). |
| TF04 | dati validi, dominio partner, e-mail già associata | Nessun nuovo account; errore sull'indirizzo e-mail (4.b1). |
| TF05 | dati validi, dominio partner, e-mail libera, link non valido | Account nello stato «In attesa di verifica»; Visitatore informato (8.a1); exit on failure. |
| TF06 | dati validi, dominio partner, e-mail libera, link valido | Account nello stato «Attivo», associato all'organizzazione del dominio; exit on success. |
| TF07 | dati validi, dominio partner, e-mail libera, invio del link rifiutato | Nessun Account, Membro o TokenVerifica residuo; risposta 500 `ERRORE_INTERNO` (docs/api/account.md). |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_AUTH_01.01 | Nome «Mario», cognome vuoto, e-mail mario.rossi@studenti.unisa.it, password valida. | Nessun account creato; errore relativo al cognome; nessuna richiesta allo stub del Servizio E-mail. |
| TC_AUTH_01.02 | Nome «Mario», cognome «Rossi», e-mail «mario.rossi@@studenti.unisa.it», password valida. | Nessun account creato; errore relativo all'indirizzo e-mail; nessuna richiesta allo stub. |
| TC_AUTH_01.03 | Dati validi con e-mail mario.rossi@gmail.com. | Nessun account creato; errore relativo all'indirizzo e-mail (dominio non autorizzato); nessuna richiesta allo stub. |
| TC_AUTH_01.04 | Ambiente: account esistente per anna.bianchi@studenti.unisa.it. Input: dati validi con la stessa e-mail. | Numero di account invariato; errore relativo all'indirizzo e-mail; nessuna richiesta allo stub. |
| TC_AUTH_01.05 | Dati validi con e-mail mario.rossi@studenti.unisa.it; poi apertura di un link con codice non emesso dal sistema. | Dopo la registrazione: account «In attesa di verifica» e una richiesta di invio allo stub. Dopo il link: account ancora «In attesa di verifica»; Visitatore informato. |
| TC_AUTH_01.06 | Dati validi con e-mail mario.rossi@studenti.unisa.it; poi apertura del link registrato dallo stub. | Dopo la registrazione: account «In attesa di verifica», una richiesta di invio del link a mario.rossi@studenti.unisa.it. Dopo il link: account «Attivo», associato a «Università degli Studi di Salerno»; attivazione confermata. |
| TC_AUTH_01.07 | Dati validi con e-mail mario.rossi@studenti.unisa.it; lo stub fa restituire `false` a `NotificaService.inviaLinkVerifica(email, link)`. | La registrazione restituisce 500 `ERRORE_INTERNO`; Account, Membro e TokenVerifica creati vengono annullati e non restano nel database. |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`); per TC_AUTH_01.04 un account preesistente con l'e-mail indicata.

**Special procedural requirements**: lo stub del Servizio E-mail fornisce il link generato al passo 4, che il test usa al passo 7. RNF_USA_2 (errori entro 1 secondo) si verifica nei test di sistema, non qui.

**Intercase dependencies**: nessuna: ogni caso di test prepara il proprio stato.
