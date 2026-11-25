# UC_AUTH_03 Consultare il profilo e registrare il veicolo — category partition e casi di test

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | GestioneProfiloControl: profilo(membroId) e registraVeicolo(membroId, dati) (SD_CP_07). |
| Requisiti coperti | RF_AUTH_08, RF_AUTH_12 |
| Responsabile | Da assegnare |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| Veicolo associato al Membro (ambiente) | Presenza | presente · assente |
| Dati del veicolo | Completezza e limiti | modello 1–100 caratteri, colore 1–50 caratteri, posti interi ≥ 1 · almeno un campo non valido [error] |
| Veicolo associato al Membro (ambiente) | Unicità | nessun veicolo · veicolo già presente [error] |

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | profilo con veicolo | Profilo con Membro, organizzazione e veicolo; dati in sola lettura (passi 2–3). |
| TF02 | profilo senza veicolo | Profilo con `veicolo: null`; il Membro può inserire i dati (passo 3). |
| TF03 | veicolo assente, dati validi | Veicolo registrato e mostrato nel profilo (passi 5–6). |
| TF04 | veicolo già presente | Secondo veicolo non registrato; conflitto segnalato (5.b1). |
| TF05 | posti pari a zero o negativi | Veicolo non registrato; errore sul campo dei posti (5.a1). |
| TF06 | modello o colore fuori limite, oppure posti non interi | Veicolo non registrato; errore sul relativo campo (5.a1). |

## Specifica dei casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_AUTH_03.01 | Membro con organizzazione e veicolo già registrato. | Risposta profilo con nome, cognome, e-mail, organizzazione e veicolo corretti; veicolo esposto in sola lettura. |
| TC_AUTH_03.02 | Membro senza veicolo; invio di modello «Fiat Panda», colore «Bianco», 4 posti. | Risposta 201 con il veicolo; una successiva consultazione del profilo riporta gli stessi dati. |
| TC_AUTH_03.03 | Membro con veicolo già registrato; invio di un secondo veicolo. | Risposta 409 `VEICOLO_GIA_PRESENTE`; il veicolo originale resta invariato. |
| TC_AUTH_03.04 | Membro senza veicolo; invio separato di 0 e -1 posti. | Ogni richiesta restituisce 400 con errore sul campo `numeroPostiPasseggeri`; nessun veicolo registrato. |
| TC_AUTH_03.05 | Membro senza veicolo; modello o colore oltre il limite, oppure posti non interi. | Risposta 400 con errore sul campo non valido; nessun veicolo registrato. |
| TC_AUTH_03.06 | Membro senza veicolo. | Risposta profilo con dati del Membro e organizzazione e `veicolo: null`. |

## Ambiente, procedure speciali e dipendenze

- **Environmental needs**: ambiente comune (`docs/test/ambiente.md`); preparare un Membro con e senza veicolo secondo il frame.
- **Special procedural requirements**: nessuna.
- **Intercase dependencies**: nessuna; ogni test prepara il proprio stato.
