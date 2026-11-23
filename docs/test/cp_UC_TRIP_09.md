# UC_TRIP_09 Valutare un partecipante al viaggio — category partition e casi di test

<!-- Copia testuale del paragrafo 4.5 del TCS (C03-TCS-ver0.2.0). Se cambia qui, si aggiorna anche il TCS su Google Drive, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | ValutaPartecipanteControl: avviaValutazione(v, valutato) per il passo 2 e registraValutazione(punteggio, commento) per il passo 4 (SD_CP_05). |
| Requisiti coperti | RF_TRIP_12, RF_TRIP_13, RF_TRIP_22 |
| Responsabile | Simone Esposito |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Viaggio (ambiente) | Stato | «Concluso» · non concluso [error] |
| Valutatore e valutato | Partecipazione | Conducente valuta un Passeggero con prenotazione accettata · Passeggero con prenotazione accettata valuta il Conducente · valutato con prenotazione non accettata [error] · valutatore estraneo al viaggio [error] |
| Valutazioni precedenti (ambiente) | Stesso valutatore, valutato e viaggio | nessuna · già presente [error] |
| Punteggio | Valore | 1 [single] · da 2 a 4 · 5 [single] · mancante [error] |
| Commento | Presenza | assente · presente |

Con i vincoli si ottengono 11 test frame: 5 di errore, 2 singoli (punteggi di confine) e 4 combinazioni (due versi della valutazione, commento assente o presente).

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | viaggio non concluso | Valutazione non consentita; Membro informato (2.a1); exit on failure. |
| TF02 | valutato con prenotazione non accettata | Valutazione non consentita (2.a1); exit on failure. |
| TF03 | valutatore estraneo al viaggio | Valutazione non consentita (2.a1); exit on failure. |
| TF04 | valutazione già presente | Nuova valutazione non consentita (2.b1); exit on failure. |
| TF05 | punteggio mancante | Valutazione non registrata; errore sul punteggio (4.a1); ripresa dal passo 3. |
| TF06 | punteggio 1 | Valutazione registrata; media del valutato aggiornata. |
| TF07 | punteggio 5 | Valutazione registrata; media del valutato aggiornata. |
| TF08 | Conducente → Passeggero, punteggio 2-4, senza commento | Valutazione registrata; media aggiornata. |
| TF09 | Conducente → Passeggero, punteggio 2-4, con commento | Valutazione e commento registrati; media aggiornata. |
| TF10 | Passeggero → Conducente, punteggio 2-4, senza commento | Valutazione registrata; media aggiornata. |
| TF11 | Passeggero → Conducente, punteggio 2-4, con commento | Valutazione e commento registrati; media aggiornata. |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_TRIP_09.01 | Ambiente: viaggio V3 «Attivo» con Anna Bianchi accettata. Input: Luca Verdi valuta Anna su V3 con punteggio 4. | Nessuna valutazione registrata; messaggio al Membro. |
| TC_TRIP_09.02 | Viaggio V2 «Concluso»; prenotazione di Marco Russo «Rifiutata». Input: Luca valuta Marco con 4. | Nessuna valutazione registrata; messaggio al Membro. |
| TC_TRIP_09.03 | V2 «Concluso». Input: Sara Galli, estranea a V2, valuta Luca con 4. | Nessuna valutazione registrata; messaggio al Membro. |
| TC_TRIP_09.04 | V2 «Concluso»; Luca ha già valutato Anna su V2 con 3. Input: Luca valuta Anna su V2 con 5. | Valutazioni di Anna invariate (una, media 3,0); messaggio al Membro. |
| TC_TRIP_09.05 | V2 «Concluso». Input: Luca valuta Anna senza punteggio, commento «Puntuale». | Nessuna valutazione registrata; errore relativo al punteggio. |
| TC_TRIP_09.06 | V2 «Concluso»; Anna senza valutazioni. Input: Luca valuta Anna con 1. | Valutazione registrata; media di Anna 1,0. |
| TC_TRIP_09.07 | V2 «Concluso»; Luca ha già le valutazioni 3 e 5 su altri viaggi. Input: Anna valuta Luca con 5. | Valutazione registrata; media di Luca 4,33 (3 + 5 + 5, diviso 3). |
| TC_TRIP_09.08 | V2 «Concluso»; Anna senza valutazioni. Input: Luca valuta Anna con 4, senza commento. | Valutazione registrata senza commento; media di Anna 4,0. |
| TC_TRIP_09.09 | Come TC_TRIP_09.08 con punteggio 3 e commento «Puntuale». | Valutazione registrata con il commento; media di Anna 3,0. |
| TC_TRIP_09.10 | Come TC_TRIP_09.07 con punteggio 4, senza commento. | Valutazione registrata; media di Luca 4,0. |
| TC_TRIP_09.11 | Come TC_TRIP_09.07 con punteggio 2 e commento «Ritardo di 10 minuti». | Valutazione registrata con il commento; media di Luca 3,33. |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`); viaggio V2 di Luca Verdi «Concluso» con Anna Bianchi «Accettata» e Marco Russo «Rifiutata»; viaggio V3 «Attivo»; le valutazioni preesistenti indicate.

**Special procedural requirements**: le medie sono confrontate con due cifre decimali. RNF citato dal caso d'uso: vedi PA_08.

**Intercase dependencies**: nessuna: le valutazioni preesistenti sono create direttamente nel database di test.
