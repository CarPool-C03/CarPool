# UC_TRIP_02 Cercare un viaggio — category partition e casi di test

<!-- Copia testuale del paragrafo 4.3 del TCS (C03-TCS-ver0.2.0), aggiornata al caso d'uso UC_TRIP_02 del RAD revisionato (sede dell'organizzazione, orario minimo, «Contributo non indicato»): TF08-TF10 nuovi, PA_03 chiuso. Da riportare nel TCS su Google Drive, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | CercaViaggioControl: cercaViaggi(filtri) per il passo 4 (SD_CP_02). |
| Requisiti coperti | RF_TRIP_03 |
| Responsabile | Michele Vitiello |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Filtri obbligatori (zona di partenza, sede, data, orario minimo) | Completezza | completi · almeno uno mancante [error] |
| Sede di destinazione | Organizzazione | del Passeggero · di un'altra organizzazione [error] |
| Data e orario minimo | Rispetto al momento corrente | non trascorsi · data precedente [error] · data corrente, orario trascorso [error] |
| Viaggi compatibili con i filtri (ambiente) | Stato e posti disponibili | nessuno [single] · solo viaggi non «Attivo» [single] · solo viaggi «Attivo» senza posti [single] · un viaggio «Attivo» con posti · più viaggi «Attivo» con posti |
| Orario di partenza dei viaggi (ambiente) | Rispetto all'orario minimo | uguale o successivo · precedente [single] |

Con i vincoli si ottengono 10 test frame: 4 di errore, 4 singoli e 2 combinazioni.

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | filtri mancanti | Ricerca non eseguita; errore su ciascun filtro mancante (4.b1). |
| TF02 | data precedente a quella corrente | Ricerca non eseguita; errore sul campo data (4.b1). |
| TF03 | nessun viaggio compatibile | Passeggero informato che non ci sono viaggi disponibili (4.a1); exit on success. |
| TF04 | solo viaggi compatibili non «Attivo» | Come TF03: i viaggi cancellati o conclusi non compaiono (4.a1). |
| TF05 | solo viaggi compatibili «Attivo» senza posti | Come TF03: i viaggi senza posti disponibili non compaiono (4.a1). |
| TF06 | un viaggio «Attivo» con posti | Elenco con quel solo viaggio: data, orario, punto di partenza, posti disponibili, contributo. |
| TF07 | più viaggi «Attivo» con posti | Elenco con tutti i viaggi compatibili, con gli stessi dati; «Contributo non indicato» dove manca. |
| TF08 | sede di un'altra organizzazione | Ricerca non eseguita; errore sul campo sede (4.b1). |
| TF09 | data corrente, orario minimo trascorso | Ricerca non eseguita; errore sul campo orario (4.b1). |
| TF10 | viaggio con orario precedente all'orario minimo | Il viaggio non compare; compaiono solo quelli con orario uguale o successivo (passo 4). |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_TRIP_02.01 | Zona «Salerno», sede vuota, data 03/12/2026, orario 08:00. | Nessun elenco; errore relativo alla sede. |
| TC_TRIP_02.02 | Zona «Salerno», sede Campus di Fisciano, data 30/11/2026, orario 08:00. | Nessun elenco; errore relativo alla data. |
| TC_TRIP_02.03 | Ambiente: nessun viaggio. Input: Salerno, Campus di Fisciano, 03/12/2026, 08:00. | Messaggio di nessun viaggio disponibile; elenco vuoto. |
| TC_TRIP_02.04 | Ambiente: un viaggio compatibile «Cancellato» e uno «Concluso». Input come TC_TRIP_02.03. | Messaggio di nessun viaggio disponibile; nessuno dei due viaggi nell'elenco. |
| TC_TRIP_02.05 | Ambiente: un viaggio compatibile «Attivo» con 2 posti offerti e 2 prenotazioni accettate. Input come TC_TRIP_02.03. | Messaggio di nessun viaggio disponibile; il viaggio non compare. |
| TC_TRIP_02.06 | Ambiente: viaggio V1 compatibile «Attivo», 3 posti offerti, 1 accettata, contributo 3,50 €, partenza Salerno, Piazza della Concordia ore 08:00; viaggio V2 «Attivo» verso Campus di Baronissi. Input come TC_TRIP_02.03. | Elenco con il solo V1: 03/12/2026, 08:00, Salerno, Piazza della Concordia, 2 posti disponibili, 3,50 €. V2 assente. |
| TC_TRIP_02.07 | Ambiente: V1 come TC_TRIP_02.06 e V3 compatibile «Attivo» alle 08:30, 4 posti, nessuna accettata, senza contributo. Input come TC_TRIP_02.03. | Elenco con V1 (2 posti disponibili, 3,50 €) e V3 (4 posti disponibili, «Contributo non indicato»). |
| TC_TRIP_02.08 | Ambiente: organizzazione «Azienda Demo» con sede «Sede di Napoli». Input: Salerno, Sede di Napoli, 03/12/2026, 08:00. | Nessun elenco; errore relativo alla sede. |
| TC_TRIP_02.09 | Zona «Salerno», sede Campus di Fisciano, data 01/12/2026, orario 09:00. | Nessun elenco; errore relativo all'orario. |
| TC_TRIP_02.10 | Ambiente: V1 come TC_TRIP_02.06 e V4 compatibile «Attivo» alle 07:30 con posti. Input come TC_TRIP_02.03. | Elenco con il solo V1; V4 assente. |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`); i viaggi di prova indicati in ciascun caso di test, pubblicati dal Conducente Luca Verdi; per TC_TRIP_02.08 una seconda organizzazione partner fittizia con una sua sede.

**Special procedural requirements**: orologio di test a 01/12/2026 ore 10:00. RNF_USA_1 (5 interazioni) si verifica nei test di sistema; RNF_PERF_3 (2 secondi con 500 viaggi attivi) con un test di carico separato.

**Intercase dependencies**: nessuna: i viaggi sono creati direttamente nel database di test, non tramite UC_TRIP_01.
