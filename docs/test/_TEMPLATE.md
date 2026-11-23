# UC_XXX_NN NomeCasoDUso — category partition e casi di test

<!-- Un file per caso d'uso: docs/test/cp_UC_<PKG>_<n>.md.
     Stessa struttura del paragrafo 4.x del TCS (C03-TCS): se cambia qui,
     si aggiorna anche il TCS su Google Drive, nella stessa PR.
     È la sezione «Verifica» dei task: i test si scrivono da qui, non dal codice.
     L'ambiente comune a tutti i casi di test è in docs/test/ambiente.md. -->

## Elemento testato

| Campo | Valore |
|---|---|
| Test item | NomeControl, operazioni dei passi ... del caso d'uso |
| Requisiti coperti | RF_XXX_NN, ... |
| Responsabile | ... |

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| parametro1 | ... | scelta A · scelta B [error] |
| parametro2 | ... | scelta C · scelta D [single] |
| (ambiente) | ... | 0 · 1 · 2 [single] |

Vincoli: `[error]`, `[single]`, `[property X]` / `[if X]`.

## Test frame

| Frame | Scelte | Esito atteso (dal caso d'uso) |
|---|---|---|
| TF01 | ... | NomeEccezione (passo 4.a1) |
| TF02 | ... | Operazione registrata |

## Casi di test

| Caso di test | Input e preparazione | Output atteso (oracolo) |
|---|---|---|
| TC_XXX_NN.01 | valori concreti | risultato atteso, stato dopo l'operazione |
| TC_XXX_NN.02 | ... | ... |

Il nome di ogni test automatico contiene l'identificativo del caso di test
(es. `TC_XXX_NN.01 - descrizione`).

## Ambiente, procedure speciali e dipendenze

- **Environmental needs**: ...
- **Special procedural requirements**: ...
- **Intercase dependencies**: nessuna, ogni caso di test prepara il proprio stato.
