# UC_ADM_01 Registrare un'organizzazione partner — category partition e casi di test

<!-- BOZZA per C03-58 (#14), derivata da docs/rad/uc/UC_ADM_01.md. Da riportare nel TCS (C03-TCS)
     su Google Drive: se cambia qui, si aggiorna anche il TCS, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | OrganizzazioneService: registraOrganizzazione(dati) per i passi 3-5 (`POST /api/organizzazioni`) e riconosciDominio(email) per l'exit condition on success (dominio riconosciuto in UC_AUTH_01, DG_13). Nessun sequence diagram: l'ordine delle chiamate è nel piano del task. |
| Requisiti coperti | RF_ADM_01, RNF_SUP_2 |
| Responsabile | Gennaro Garone, Roberto Rega |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| denominazione | Presenza e lunghezza | da 1 a 200 caratteri · mancante [error] · oltre 200 caratteri [error] |
| sedi | Numero | una · più di una [single] · nessuna [error] |
| sedi[i] | Completezza | nome e indirizzo presenti · indirizzo mancante [error] |
| domini | Numero | uno · più di uno [single] · nessuno [error] |
| domini[i] | Forma | `nome.dominio` · contiene `@` [error] · ripetuto nella stessa richiesta [error] |
| domini[i] (ambiente) | Uso da parte di altre organizzazioni | libero · già usato da un'altra organizzazione [error] |

Con i vincoli si ottengono 10 test frame: 8 di errore, 1 singolo (più sedi e più domini, con un dominio
scritto in maiuscolo) e 1 combinazione dei valori restanti.

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | denominazione mancante | Nulla registrato; errore sulla denominazione (4.a1); ripresa dal passo 3. |
| TF02 | denominazione oltre 200 caratteri | Nulla registrato; errore sulla denominazione (4.a1). |
| TF03 | nessuna sede | Nulla registrato; errore sulle sedi (4.a1). |
| TF04 | una sede senza indirizzo | Nulla registrato; errore sull'indirizzo di quella sede (4.a1). |
| TF05 | nessun dominio | Nulla registrato; errore sui domini (4.a1). |
| TF06 | dominio che contiene `@` | Nulla registrato; errore su quel dominio (4.a1). |
| TF07 | dominio ripetuto nella stessa richiesta | Nulla registrato; errore sul dominio ripetuto (4.a1). |
| TF08 | dominio già usato da un'altra organizzazione | Nessuna organizzazione, sede o dominio registrati; errore su quel dominio (4.b1). |
| TF09 | una sede, un dominio libero | Organizzazione attiva registrata con la sede e il dominio; dominio riconosciuto subito nelle registrazioni; exit on success. |
| TF10 | più sedi, più domini, uno in maiuscolo | Organizzazione attiva con tutte le sedi e tutti i domini, salvati in minuscolo; exit on success. |

## Specifica dei casi di test

Dati comuni: denominazione «Tecnopolo Demo S.r.l.», sede «Sede centrale», «Via delle Prove, 1»,
dominio `tecnopolo.example` (dati fittizi).

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_ADM_01.01 | Dati comuni senza denominazione. | Errore sul campo `denominazione`; numero di organizzazioni, sedi e domini invariato. |
| TC_ADM_01.02 | Dati comuni con denominazione di 201 caratteri. | Errore sul campo `denominazione`; nulla registrato. |
| TC_ADM_01.03 | Dati comuni con `sedi` vuoto. | Errore sul campo `sedi`; nulla registrato. |
| TC_ADM_01.04 | Dati comuni con la sede senza indirizzo. | Errore sul campo `sedi[0].indirizzo`; nulla registrato. |
| TC_ADM_01.05 | Dati comuni con `domini` vuoto. | Errore sul campo `domini`; nulla registrato. |
| TC_ADM_01.06 | Dati comuni con dominio `info@tecnopolo.example`. | Errore sul campo `domini[0]`; nulla registrato. |
| TC_ADM_01.07 | Dati comuni con domini `tecnopolo.example`, `tecnopolo.example`. | Errore sul campo `domini[1]`; nulla registrato. |
| TC_ADM_01.08 | Dati comuni con domini `tecnopolo.example`, `studenti.unisa.it` (già dell'organizzazione di prova). | Errore sul campo `domini[1]` «dominio già usato da un'altra organizzazione»; nessuna nuova organizzazione, sede o dominio; `tecnopolo.example` non riconosciuto. |
| TC_ADM_01.09 | Dati comuni; poi riconoscimento dell'indirizzo mario.rossi@tecnopolo.example. | Organizzazione registrata, attiva, con 1 sede e il dominio `tecnopolo.example`; il riconoscimento restituisce «Tecnopolo Demo S.r.l.» senza riavvio del servizio. |
| TC_ADM_01.10 | Dati comuni con le sedi «Sede centrale» e «Laboratori», «Via dei Test, 2», e i domini `tecnopolo.example`, `Lab.Tecnopolo.Example`. | Organizzazione attiva con 2 sedi e i domini `tecnopolo.example`, `lab.tecnopolo.example`. |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`), più un account Amministratore di prova
(amministratore@carpool.example, «Attivo», senza Membro) autenticato in ogni caso di test.

**Special procedural requirements**: «nulla registrato» si verifica contando organizzazioni, sedi e domini
prima e dopo l'operazione (unica transazione). In TC_ADM_01.09 il riconoscimento del dominio si chiama
subito dopo la registrazione, senza riavviare il backend (DG_13, RNF_SUP_2). L'accesso negato a un Membro
(403) è un test dell'issue, non di questo TCS. RNF_USA_2 si verifica nei test di sistema.

**Intercase dependencies**: nessuna: ogni caso di test prepara il proprio stato.
