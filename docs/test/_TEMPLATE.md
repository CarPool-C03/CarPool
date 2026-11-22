# Category partition di UC_XXX_NN — `nomeOperazione()`

<!-- Un file per caso d'uso: docs/test/cp_UC_<PKG>_<n>.md.
     È la sezione «Verifica» del task: i test si scrivono da qui, non dal codice. -->

## Categorie e scelte

| Parametro o ambiente | Categoria | Scelte |
|---|---|---|
| parametro1 | ... | scelta A · scelta B [error] |
| parametro2 | ... | scelta C · scelta D [single] |
| (ambiente) | ... | 0 · 1 · 2 [single] |

Vincoli usati: `[error]`, `[single]`, `[property X]` / `[if X]`.

## Test frame

| Frame | parametro1 | parametro2 | ambiente | Esito atteso (dal caso d'uso) |
|---|---|---|---|---|
| TF01 | ... | ... | ... | NomeEccezione |
| TF02 | ... | ... | ... | Operazione registrata |

Valori rappresentativi per i frame non di errore: <!-- es. data entro 7 giorni = domani -->
