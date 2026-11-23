# UC_ORG_01 Generare un report PSCL — category partition e casi di test

<!-- Copia testuale del paragrafo 4.6 del TCS (C03-TCS-ver0.2.0). Se cambia qui, si aggiorna anche il TCS su Google Drive, nella stessa PR. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | GeneraReportControl: generaReport(sede, inizio, fine) per il passo 4 (SD_CP_06). |
| Requisiti coperti | RF_ORG_01 |
| Responsabile | Vladyslav Maslov |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Periodo | Ordine delle date | inizio precede la fine · inizio uguale alla fine [error] · inizio successivo alla fine [error] |
| Periodo | Rispetto alla data corrente | non successivo · successivo [error] |
| Viaggi della sede nel periodo (ambiente) | Numero | nessuno [single] · uno · più di uno |
| Periodo | Ampiezza | fino a un mese · 12 mesi [single] |

Con i vincoli si ottengono 7 test frame: 3 di errore, 2 singoli e 2 combinazioni. Il frame di 12 mesi deriva dallo special requirement RNF_PERF_2.

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | inizio uguale alla fine | Nessun report; errore sulle date (4.b1); ripresa dal passo 3. |
| TF02 | inizio successivo alla fine | Nessun report; errore sulle date (4.b1). |
| TF03 | periodo successivo alla data corrente | Nessun report; errore sulle date (4.b1). |
| TF04 | nessun viaggio della sede nel periodo | Mobility Manager informato; report con valori nulli (4.a1); exit on success. |
| TF05 | un viaggio, periodo di un mese | Report con i conteggi di quel viaggio; nessun dato identificativo. |
| TF06 | più viaggi, periodo di un mese | Report con i conteggi dei soli viaggi della sede nel periodo; nessun dato identificativo. |
| TF07 | periodo di 12 mesi | Report presentato in meno di 10 secondi (RNF_PERF_2). |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_ORG_01.01 | Mobility Manager Paolo Neri; sede Campus di Fisciano; periodo 15/10/2026 - 15/10/2026. | Nessun report; errore relativo alle date. |
| TC_ORG_01.02 | Come TC_ORG_01.01 con periodo 31/10/2026 - 01/10/2026. | Nessun report; errore relativo alle date. |
| TC_ORG_01.03 | Come TC_ORG_01.01 con periodo 01/01/2027 - 31/01/2027. | Nessun report; errore relativo alle date. |
| TC_ORG_01.04 | Ambiente: dataset D (sotto). Input: Campus di Fisciano, 01/08/2026 - 31/08/2026. | Messaggio di nessun viaggio; report con viaggi condivisi 0, posti offerti 0, passeggeri trasportati 0. |
| TC_ORG_01.05 | Ambiente: solo il viaggio Va del dataset D. Input: Campus di Fisciano, 01/10/2026 - 31/10/2026. | Report: viaggi condivisi 1, posti offerti 4, passeggeri trasportati 2; nessun nome, cognome o e-mail. |
| TC_ORG_01.06 | Ambiente: dataset D. Input: Campus di Fisciano, 01/10/2026 - 31/10/2026. | Report: viaggi condivisi 3 (Va, Vb, Vc, viaggi conclusi della sede nel periodo), posti offerti 9, passeggeri trasportati 3; esclusi Vd e Ve; nessun dato identificativo. |
| TC_ORG_01.07 | Ambiente: volume di viaggi per 12 mesi (PA_07). Input: Campus di Fisciano, 01/12/2025 - 30/11/2026. | Report presentato in meno di 10 secondi; nessun dato identificativo. |

## Ambiente, procedure speciali e dipendenze

**Environmental needs**: ambiente comune (`docs/test/ambiente.md`). Dataset D, tutti viaggi «Concluso» di Luca Verdi: Va verso Fisciano il 05/10/2026, 4 posti, 2 accettate; Vb verso Fisciano il 12/10/2026, 3 posti, 1 accettata; Vc verso Fisciano il 19/10/2026, 2 posti, nessuna accettata; Vd verso Fisciano il 15/09/2026 (fuori periodo); Ve verso Baronissi il 10/10/2026 (altra sede).

**Special procedural requirements**: per l'anonimato (RNF_LEG_01) il test controlla che il report non contenga nomi, cognomi o indirizzi e-mail dei Membri di prova. TC_ORG_01.07 misura il tempo dalla richiesta alla presentazione del report.

**Intercase dependencies**: nessuna: i viaggi sono creati direttamente nel database di test.
