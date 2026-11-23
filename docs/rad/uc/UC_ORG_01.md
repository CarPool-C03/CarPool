# UC_ORG_01 Generare un report PSCL

<!-- Copia testuale del caso d'uso del RAD (C03-RAD-ver1.0.0, par. 3.4.2). Se cambia il RAD, si aggiorna questo file nella stessa PR. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_ORG_01 |
| Nome | Generare un report PSCL |
| Data | 06/11/2026 |
| Versione | 1.0 |
| Autore | Vladyslav Maslov |
| Descrizione | Consente al Mobility Manager di ottenere statistiche aggregate e anonime sui viaggi condivisi della propria organizzazione, per un periodo e una sede indicati, a supporto della redazione del PSCL. |
| Attore principale | Mobility Manager — obiettivo: Disporre di dati verificabili sugli spostamenti condivisi per redigere il PSCL. |
| Attori secondari | Nessuno |
| Entry condition | Il caso d’uso inizia quando il Mobility Manager, autenticato, richiede la generazione di un report PSCL. |
| Exit condition on success | Il caso d’uso termina quando il sistema ha presentato il report aggregato e anonimo relativo al periodo e alla sede indicati. |
| Exit condition on failure | Il caso d’uso termina senza alcun report: il periodo indicato non è valido e il Mobility Manager abbandona la richiesta. |
| Rilevanza / User priority | Alta |
| Frequenza stimata | 1/settimana |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Mobility Manager | Richiede la generazione di un report PSCL. |
| 2 | Sistema | Richiede il periodo di analisi e la sede dell’organizzazione. |
| 3 | Mobility Manager | Indica il periodo e la sede e ne conferma l’invio. |
| 4 | Sistema | Verifica che la data di inizio del periodo preceda la data di fine e che il periodo non sia successivo alla data corrente; calcola, per la sede e il periodo indicati, il numero di viaggi condivisi, di posti offerti e di passeggeri trasportati, escludendo qualsiasi dato che identifichi un singolo Membro; presenta il report con le statistiche aggregate. |

## Flusso alternativo: Nessun viaggio nel periodo

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva che nel periodo non risultano viaggi condivisi per la sede indicata, ne informa il Mobility Manager e presenta il report con valori nulli; il caso d’uso termina con exit condition on success. |

## Flusso di errore: Periodo non valido

| Passo | Attore | Azione |
|---|---|---|
| 4.b1 | Sistema | Rileva un periodo non valido e segnala l’errore relativo alle date. |
| 4.b2 | Sistema | Il caso d’uso riprende dal passo 3; se il Mobility Manager abbandona, termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | SC_CP_07 |
| RF collegati | RF_ORG_01 |
| Special requirements | RNF_LEG_01: nessun dato identificativo nei report. / RNF_PERF_2: generazione del report di 12 mesi di una sede in meno di 10 secondi. |
