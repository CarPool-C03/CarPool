# Pipeline agentica di CarPool — guida per il team

Gli agenti (GitHub Copilot e OpenCode) scrivono codice a partire dai **modelli**
del RAD e dell'SDD. Le persone decidono la sequenza dei passi e approvano nei
punti fissati. Chi integra il codice ne risponde e deve saperlo spiegare.
Configurazione iniziale (solo PM): [setup-pipeline-pm.md](setup-pipeline-pm.md).

## Le fasi di un caso d'uso

| # | Fase | Chi | Come parte | Risultato |
|---|---|---|---|---|
| 0 | Controllo dei modelli | agente `controllo-modelli` | in locale o con `/oc` | incoerenze tra UC, sequence, class, CP |
| 1 | Task | PM | issue dal modulo **Task per agente** | issue con Specifica, Ambito, Verifica |
| 2 | Piano | agente `pianificatore` | il PM aggiunge `fase:piano` | commento con il piano |
| ✋ | Approvazione del piano | sviluppatore assegnato | aggiunge `fase:implementazione` | — |
| 3 | Implementazione | agente `implementatore` | label `fase:implementazione` | branch e PR |
| 4 | Test dai test frame | agente `tester` (sessione separata) | label `fase:test` sulla PR | commit con un test per frame |
| 5 | CI | automatico | PR aperta, aggiornata o pronta | job `build` e `guardia` |
| 6 | Revisione rispetto ai modelli | agente `revisore` | PR segnata **Ready for review** (o label `fase:revisione`) | commento con le differenze |
| ✋ | Revisione umana e merge | un PM diverso dall'autore | Approve, poi Squash and merge | issue chiusa |

Fuori dai punti ✋ l'agente lavora da solo. Ogni gesto resta nella cronologia
dell'issue o della PR.

## Tre modi di lavorare (si possono combinare)

**A. Pipeline OpenCode su GitHub (label).** Le fasi 2–4 e 6 girano in GitHub
Actions con gli agenti di `.opencode/agents/`. Basta aggiungere le label.
Per correzioni puntuali scrivi in un commento: `/oc rinomina il metodo come nel class diagram`.

**B. Copilot coding agent.** Nell'issue: *Assignees → Copilot* e, se richiesto,
scegli l'agente personalizzato (`pianificatore`, `implementatore`, ...).
Copilot apre una PR in bozza e lavora in Actions. Correzioni: commenti con
`@copilot`. I workflow sulle PR di Copilot (CI inclusa) partono solo dopo
**Approve and run workflows**. Quando ha finito: **Ready for review**.

**C. In locale nell'editor.**
- *OpenCode*: `opencode` nella cartella del repo. Legge `AGENTS.md` e
  `opencode.json`. Richiama un ruolo con `@pianificatore`, `@tester`, ... oppure
  avvialo come agente principale (Tab).
- *Copilot (VS Code)*: Copilot Chat in modalità Agent; nel menu degli agenti
  compaiono quelli di `.github/agents/`.
- Poi push del branch e PR come in `CONTRIBUTING.md`.

## Come scrivere un buon task
- **Specifica**: solo i file necessari (vedi tabella sotto), solo le classi rilevanti.
- **Ambito**: i file e i metodi da toccare, ricavati dal sequence diagram.
- **Verifica**: i test frame della category partition (`docs/test/cp_<UC>.md`).
- Dimensione: **un caso d'uso per task**, PR di poche centinaia di righe,
  chiusa in un giorno. Una PR da 2.000 righe di fatto non viene rivista.

| Tipo di task | Caso d'uso | Sequence | Class | Component | Category partition |
|---|---|---|---|---|---|
| Model e storage | | | ● | | |
| Control di un UC | ● | ● | ○ | ○ | |
| Route/API e pagine React | ● | ● | ○ | ● | |
| Test di un UC | ● | | ○ | | ● |
| Correzione di un difetto | ● | ○ | | | ○ |
| Revisione di una PR | ● | ● | ● | ● | ● |

● da allegare · ○ solo un estratto. Component e deployment sono già in `AGENTS.md`.

## Ordine di generazione del codice
1. **Model** (dal class diagram) → 2. **Storage** (class + deployment) →
3. **Control** (UC + sequence) → 4. **Route/API e frontend** (UC + sequence).
Model e storage sono condivisi: si generano una volta, si rivedono con cura e
si considerano stabili. Da lì i casi d'uso vanno in parallelo, un branch per task.

## Lavoro in parallelo
- Le interfacce tra le parti (component diagram) si fissano prima e si cambiano
  solo con una decisione esplicita.
- Le classi condivise hanno un proprietario: chi deve cambiarle lo segnala e la
  modifica la fa il proprietario, in una PR separata.
- Un branch per task; in locale una copia di lavoro per agente (`git worktree add ../carpool-CP-12 -b feature/CP-12-...`).
- Merge piccoli e frequenti.

## Quando fermare l'agente
- **3 tentativi** falliti sullo stesso errore → il task passa a una persona.
- Segnali d'allarme: modifica i test per farli passare, aggiunge `.skip`/`.only`
  o rimuove asserzioni, aggiunge dipendenze, tocca file fuori ambito, ripete la
  stessa correzione. Il job `guardia` della CI ne segnala buona parte.
- Un run bloccato si ferma da *Actions → Cancel workflow*.

## Definition of Done
- [ ] Piano approvato prima dell'implementazione.
- [ ] Nomi del class diagram e dipendenze del component diagram rispettati.
- [ ] Un test per ogni test frame, tutti verdi nella CI.
- [ ] Nessun test esistente modificato senza motivazione scritta nella PR.
- [ ] Nessuna nuova dipendenza non approvata.
- [ ] Modelli modificati aggiornati nella stessa PR.
- [ ] La PR indica task, caso d'uso, artefatti usati e tentativi.
- [ ] Approvata da un PM diverso dall'autore.
- [ ] L'autore sa spiegare il codice.

## Problemi tipici
| Sintomo | Causa probabile |
|---|---|
| Il run non compare in Actions | il workflow non è ancora su `main` |
| Job «skipped» | label scritta diversa, oppure variabile `OPENCODE_MODEL` non impostata |
| Errore di autenticazione col modello | secret della chiave mancante o modello sbagliato |
| L'agente dice di non poter eseguire un comando | il comando non è permesso nel file dell'agente |
| La PR aperta dall'agente non avvia la CI | le azioni fatte con il token del workflow non avviano altri workflow: *Convert to draft* e poi *Ready for review*, oppure fai un push |
| Il run si ferma prima di finire | timeout raggiunto: rivedi il task prima di alzare i limiti |
