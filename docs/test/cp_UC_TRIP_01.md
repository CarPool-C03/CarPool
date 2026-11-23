# UC_TRIP_01 Pubblicare un viaggio — category partition e casi di test

<!-- Copia testuale del paragrafo 4.2 del TCS (C03-TCS-ver0.2.0). Se cambia qui, si aggiorna anche il TCS su Google Drive, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | PubblicaViaggioControl: avviaPubblicazione() per il passo 2 e pubblica(dati) per il passo 4 (SD_CP_03). |
| Requisiti coperti | RF_TRIP_01a, RF_TRIP_01b, RF_TRIP_02 |
| Responsabile | Roberto Rega |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Profilo del Conducente (ambiente) | Veicolo | associato · non associato [error] |
| Dati obbligatori (data, orario, punto di partenza, sede, posti) | Completezza | completi · almeno uno mancante [error] |
| Data e orario di partenza | Rispetto al momento corrente | successivi · coincidenti [error] · già trascorsi [error] |
| Posti offerti | Rispetto ai posti del veicolo (4) | zero [error] · da 1 a inferiori · uguali [single] · superiori [error] |
| Contributo spese | Presenza | assente · presente |

Con i vincoli si ottengono 9 test frame: 6 di errore, 1 singolo e 2 combinazioni (posti inferiori, contributo assente o presente). La scelta «zero» deriva dal vincolo postiOfferti ≥ 1 del class diagram (CD_CP_01) e da validaDati in SD_CP_03.

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | veicolo non associato | Nessun viaggio; Conducente informato che deve prima inserire il veicolo (2.a1); exit on failure. |
| TF02 | dati mancanti | Nessun viaggio registrato; errore sul dato mancante (4.a1). |
| TF03 | data e orario coincidenti con il momento corrente | Nessun viaggio registrato; errore su data e orario (4.a1). |
| TF04 | data e orario già trascorsi | Nessun viaggio registrato; errore su data e orario (4.a1). |
| TF05 | posti superiori ai posti del veicolo | Nessun viaggio registrato; errore sui posti offerti (4.a1). |
| TF06 | posti offerti pari a zero | Nessun viaggio registrato; errore sui posti offerti (4.a1). |
| TF07 | posti uguali ai posti del veicolo | Viaggio «Attivo», disponibile alla ricerca; pubblicazione confermata. |
| TF08 | posti inferiori, contributo assente | Viaggio «Attivo», disponibile alla ricerca, senza contributo. |
| TF09 | posti inferiori, contributo presente | Viaggio «Attivo», disponibile alla ricerca, con il contributo indicato. |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_TRIP_01.01 | Ambiente: Conducente Sara Galli senza veicolo. Input: richiesta di pubblicazione. | Nessun viaggio registrato; messaggio che chiede di inserire prima i dati del veicolo; i dati del viaggio non vengono richiesti. |
| TC_TRIP_01.02 | Conducente Luca Verdi; data 03/12/2026, orario 08:00, punto di partenza vuoto, sede Campus di Fisciano, 2 posti. | Nessun viaggio registrato; errore relativo al punto di partenza. |
| TC_TRIP_01.03 | Come TC_TRIP_01.02 con punto di partenza «Salerno, Piazza della Concordia», data 01/12/2026, orario 10:00. | Nessun viaggio registrato; errore relativo a data e orario. |
| TC_TRIP_01.04 | Come TC_TRIP_01.03 con orario 09:00. | Nessun viaggio registrato; errore relativo a data e orario. |
| TC_TRIP_01.05 | Dati validi (data 03/12/2026, orario 08:00) con 5 posti offerti. | Nessun viaggio registrato; errore relativo ai posti offerti. |
| TC_TRIP_01.06 | Dati validi (data 03/12/2026, orario 08:00) con 0 posti offerti. | Nessun viaggio registrato; errore relativo ai posti offerti. |
| TC_TRIP_01.07 | Dati validi con 4 posti offerti, nessun contributo. | Un viaggio «Attivo» con 4 posti; restituito da una ricerca per Campus di Fisciano del 03/12/2026; pubblicazione confermata. |
| TC_TRIP_01.08 | Dati validi con 2 posti offerti, nessun contributo. | Un viaggio «Attivo» con 2 posti e contributo assente; restituito dalla ricerca. |
| TC_TRIP_01.09 | Dati validi con 2 posti offerti e contributo 3,50 €. | Un viaggio «Attivo» con 2 posti e contributo 3,50 € memorizzato come informazione; restituito dalla ricerca. |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`); per TC_TRIP_01.01 il Membro Sara Galli senza veicolo associato.

**Special procedural requirements**: l'orologio di test è fissato a 01/12/2026 ore 10:00: TC_TRIP_01.03 prova il confine esatto. RNF_USA_3 (pubblicazione in meno di 2 minuti) si verifica con utenti nei test di sistema.

**Intercase dependencies**: nessuna; la verifica «disponibile alla ricerca» usa la ricerca come osservatore, senza dipendere dai casi di test di UC_TRIP_02.
