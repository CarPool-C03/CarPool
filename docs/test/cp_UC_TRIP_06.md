# UC_TRIP_06 Rispondere a una richiesta di prenotazione — category partition e casi di test

<!-- Copia testuale del paragrafo 4.4 del TCS (C03-TCS-ver0.2.0). Se cambia qui, si aggiorna anche il TCS su Google Drive, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | RispondiRichiestaControl: accetta(r) per il passo 2 e rifiuta(r) per il passo 1.a2 (SD_CP_04). |
| Requisiti coperti | RF_TRIP_07, RF_TRIP_08, RF_TRIP_09, RF_TRIP_10, RF_TRIP_11 |
| Responsabile | Gennaro Garone |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Decisione del Conducente | Tipo | accettazione [property Acc] · rifiuto |
| Viaggio (ambiente) | Stato | «Attivo» · «Cancellato» [error] · «Concluso» [error] |
| Prenotazioni accettate (ambiente) | Rispetto ai posti offerti (3) | non rilevante [if not Acc] · nessuna [if Acc] · 2, cioè ultimo posto [if Acc] [single] · 3, cioè posti esauriti [if Acc] [error] |
| Richieste concorrenti (ambiente) | Accettazioni simultanee sull'ultimo posto | una · due [if Acc] [single] |

Con i vincoli si ottengono 7 test frame: 3 di errore, 2 singoli, 1 accettazione con posti liberi e 1 rifiuto. Il frame di concorrenza deriva dallo special requirement del caso d'uso (prenotazioni accettate mai superiori ai posti offerti).

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | viaggio «Cancellato» | Richiesta invariata («In attesa»); Conducente informato (2.b1); exit on failure. |
| TF02 | viaggio «Concluso» | Come TF01 (2.b1). |
| TF03 | accettazione, posti esauriti | Richiesta «In attesa»; Conducente informato dell'esaurimento (2.a1); exit on failure. |
| TF04 | accettazione, ultimo posto | Richiesta «Accettata»; posti disponibili a zero; viaggio escluso dalla ricerca; notifica di conferma inoltrata. |
| TF05 | accettazione, posti liberi | Richiesta «Accettata»; posti disponibili diminuiti di uno; notifica di conferma inoltrata. |
| TF06 | rifiuto, viaggio «Attivo» | Richiesta «Rifiutata»; posti invariati; notifica di esito negativo inoltrata (1.a2). |
| TF07 | due accettazioni simultanee sull'ultimo posto | Una sola richiesta «Accettata»; l'altra resta «In attesa» (2.a1); accettate mai oltre 3. |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_TRIP_06.01 | Ambiente: viaggio V1 «Cancellato», richiesta R1 di Anna Bianchi «In attesa». Input: accettazione di R1. | R1 «In attesa»; nessuna richiesta allo stub; messaggio al Conducente. |
| TC_TRIP_06.02 | Ambiente: V1 «Concluso», R1 «In attesa». Input: rifiuto di R1. | R1 «In attesa»; nessuna richiesta allo stub; messaggio al Conducente. |
| TC_TRIP_06.03 | Ambiente: V1 «Attivo», 3 posti, 3 richieste accettate, R1 «In attesa». Input: accettazione di R1. | R1 «In attesa»; accettate ancora 3; messaggio di posti esauriti; nessuna richiesta allo stub. |
| TC_TRIP_06.04 | Ambiente: V1 «Attivo», 3 posti, 2 accettate, R1 «In attesa». Input: accettazione di R1. | R1 «Accettata»; posti disponibili 0; V1 non restituito dalla ricerca; una richiesta allo stub di conferma per Anna Bianchi; conferma al Conducente. |
| TC_TRIP_06.05 | Ambiente: V1 «Attivo», 3 posti, nessuna accettata, R1 «In attesa». Input: accettazione di R1. | R1 «Accettata»; posti disponibili 2; V1 ancora restituito dalla ricerca; una richiesta di conferma allo stub. |
| TC_TRIP_06.06 | Ambiente come TC_TRIP_06.05. Input: rifiuto di R1. | R1 «Rifiutata»; posti disponibili 3; una richiesta allo stub di esito negativo per Anna Bianchi; conferma al Conducente. |
| TC_TRIP_06.07 | Ambiente: V1 «Attivo», 3 posti, 2 accettate, R1 (Anna Bianchi) e R2 (Marco Russo) «In attesa». Input: accettazione di R1 e R2 avviate in parallelo. | Esattamente una tra R1 e R2 «Accettata», l'altra «In attesa»; accettate 3; una sola richiesta di conferma allo stub. |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`); viaggio V1 del Conducente Luca Verdi verso Campus di Fisciano il 03/12/2026 e le richieste indicate.

**Special procedural requirements**: RNF_PERF_1: per TC_TRIP_06.04-06 l'istante della richiesta allo stub dista meno di 60 secondi dalla risposta del Conducente. TC_TRIP_06.07 richiede due operazioni concorrenti sullo stesso database (due connessioni).

**Intercase dependencies**: nessuna: le richieste di prenotazione sono create direttamente nel database di test.
