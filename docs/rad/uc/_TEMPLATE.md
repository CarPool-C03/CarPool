# UC_XXX_NN NomeCasoDUso

<!-- Un file per caso d'uso: docs/rad/uc/UC_<PKG>_<n>.md (es. UC_TRIP_01.md).
     Stessa struttura e stesso contenuto della tabella del caso d'uso nel RAD
     (template del corso): se cambia il RAD, si aggiorna questo file nella stessa PR.
     Regola del team: non citare mai pulsanti o altri elementi di interfaccia.
     I passi dei flussi alternativi e di errore si numerano come nel RAD
     (<passo>.<lettera><n>, es. 4.a1, 4.a2): TCS, piani e test li citano così. -->

| Campo | Valore |
|---|---|
| Identificativo | UC_XXX_NN |
| Nome | NomeCasoDUso |
| Data | gg/mm/aaaa |
| Versione | 1.0 |
| Autore | Cognome Nome |
| Descrizione | ... |
| Attore principale | Attore — obiettivo: ... |
| Attori secondari | «system» Attore — obiettivo: ... (oppure Nessuno) |
| Entry condition | Il caso d'uso inizia quando ... |
| Exit condition on success | Il caso d'uso termina quando ... |
| Exit condition on failure | Il caso d'uso termina senza ...: elenco delle cause |
| Rilevanza / User priority | Alta / Media / Bassa |
| Frequenza stimata | n/giorno |
| Extension point | – |
| Generalization of | – |

## Flusso di eventi principale

| Passo | Attore | Azione |
|---|---|---|
| 1 | Attore | ... |
| 2 | Sistema | ... |

## Flusso alternativo: Titolo

<!-- Se non ce ne sono: «## Flusso alternativo: Nessuno» senza tabella. -->

| Passo | Attore | Azione |
|---|---|---|
| 1.a1 | Attore | ... |
| 1.a2 | Sistema | ...; il caso d'uso termina con exit condition on success. |

## Flusso di errore: Titolo

<!-- Un'intestazione per ciascun flusso di errore, con nome preciso, passo in cui
     si verifica e come riprende il flusso. -->

| Passo | Attore | Azione |
|---|---|---|
| 4.a1 | Sistema | Rileva ..., non ... e segnala l'errore relativo a ... |
| 4.a2 | Sistema | Il caso d'uso riprende dal passo 3; se l'Attore abbandona, termina con exit condition on failure. |

## Note

| Campo | Valore |
|---|---|
| Scenari collegati | SC_CP_NN |
| RF collegati | RF_XXX_NN |
| Special requirements | RNF_XXX_N: ... (requisiti verificabili, es. «entro 1 secondo») |
