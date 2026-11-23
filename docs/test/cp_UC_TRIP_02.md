# UC_TRIP_02 Cercare un viaggio — category partition e casi di test

<!-- Copia testuale del paragrafo 4.3 del TCS (C03-TCS-ver0.2.0). Se cambia qui, si aggiorna anche il TCS su Google Drive, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | CercaViaggioControl: cercaViaggi(filtri) per il passo 4 (SD_CP_02). |
| Requisiti coperti | RF_TRIP_03 |
| Responsabile | Michele Vitiello |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Filtri obbligatori (zona di partenza, sede, data, orario) | Completezza | completi · almeno uno mancante [error] |
| Data e orario | Rispetto al momento corrente | non trascorsi · già trascorsi [error] |
| Viaggi compatibili con i filtri (ambiente) | Stato e posti disponibili | nessuno [single] · solo viaggi non «Attivo» [single] · solo viaggi «Attivo» senza posti [single] · un viaggio «Attivo» con posti · più viaggi «Attivo» con posti |

Con i vincoli si ottengono 7 test frame: 2 di errore, 3 singoli e 2 combinazioni.

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | filtri mancanti | Ricerca non eseguita; errore su ciascun filtro mancante (4.b1). |
| TF02 | data e orario già trascorsi | Ricerca non eseguita; errore su data e orario (4.b1). |
| TF03 | nessun viaggio compatibile | Passeggero informato che nessun viaggio è compatibile (4.a1); exit on success. |
| TF04 | solo viaggi compatibili non «Attivo» | Come TF03: i viaggi cancellati o conclusi non compaiono (4.a1). |
| TF05 | solo viaggi compatibili «Attivo» senza posti | Come TF03: i viaggi senza posti disponibili non compaiono (4.a1). |
| TF06 | un viaggio «Attivo» con posti | Elenco con quel solo viaggio: data, orario, punto di partenza, posti disponibili, contributo. |
| TF07 | più viaggi «Attivo» con posti | Elenco con tutti i viaggi compatibili, con gli stessi dati. |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_TRIP_02.01 | Zona «Salerno», sede vuota, data 03/12/2026, orario 08:00. | Nessun elenco; errore relativo alla sede. |
| TC_TRIP_02.02 | Zona «Salerno», sede Campus di Fisciano, data 30/11/2026, orario 08:00. | Nessun elenco; errore relativo alla data. |
| TC_TRIP_02.03 | Ambiente: nessun viaggio. Input: Salerno, Campus di Fisciano, 03/12/2026, 08:00. | Messaggio di nessun viaggio compatibile; elenco vuoto. |
| TC_TRIP_02.04 | Ambiente: un viaggio compatibile «Cancellato» e uno «Concluso». Input come TC_TRIP_02.03. | Messaggio di nessun viaggio compatibile; nessuno dei due viaggi nell'elenco. |
| TC_TRIP_02.05 | Ambiente: un viaggio compatibile «Attivo» con 2 posti offerti e 2 prenotazioni accettate. Input come TC_TRIP_02.03. | Messaggio di nessun viaggio compatibile; il viaggio non compare. |
| TC_TRIP_02.06 | Ambiente: viaggio V1 compatibile «Attivo», 3 posti offerti, 1 accettata, contributo 3,50 €, partenza Salerno, Piazza della Concordia ore 08:00; viaggio V2 «Attivo» verso Campus di Baronissi. Input come TC_TRIP_02.03. | Elenco con il solo V1: 03/12/2026, 08:00, Salerno, Piazza della Concordia, 2 posti disponibili, 3,50 €. V2 assente. |
| TC_TRIP_02.07 | Ambiente: V1 come TC_TRIP_02.06 e V3 compatibile «Attivo», 4 posti, nessuna accettata, senza contributo. Input come TC_TRIP_02.03. | Elenco con V1 (2 posti disponibili, 3,50 €) e V3 (4 posti disponibili, contributo assente). |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`); i viaggi di prova indicati in ciascun caso di test, pubblicati dal Conducente Luca Verdi.

**Special procedural requirements**: orologio di test a 01/12/2026 ore 10:00. RNF_USA_1 (5 interazioni) si verifica nei test di sistema. Il criterio di compatibilità sull'orario è un punto aperto (PA_03): i viaggi di prova hanno lo stesso orario del filtro.

**Intercase dependencies**: nessuna: i viaggi sono creati direttamente nel database di test, non tramite UC_TRIP_01.
