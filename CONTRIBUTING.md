# Come contribuire a CarPool

Questa guida spiega il flusso di lavoro che tutto il team segue per portare una modifica nel codice, dalla creazione del branch fino all'unione nel `main`.

**Regola d'oro: nessuno lavora né fa push direttamente su `main`.** Ogni modifica passa da un branch e da una pull request approvata da un Project Manager (Giuseppe D'Ambrosio o Pietro Coticella).

> Task con agenti (Copilot, OpenCode): stesso flusso, con le fasi avviate dalle label ([docs/agentic-workflow.md](docs/agentic-workflow.md)). Chi apre la PR deve saper spiegare tutto il codice.

## Il flusso in breve

1. Aggiorna il tuo `main` locale
2. Crea un branch per la tua attività
3. Lavora e fai i commit
4. Fai il push del branch su GitHub
5. Apri la pull request
6. Un Project Manager fa la review; tu correggi se serve
7. Si fa il merge nel `main` e si cancella il branch

---

## 0. Prima volta: clona il repository

Lo fai una sola volta, sul tuo computer:

```bash
git clone https://github.com/CarPool-C03/CarPool.git
cd CarPool
```

## 1. Aggiorna il `main` locale

Prima di iniziare qualsiasi attività, parti sempre dall'ultima versione del `main`:

```bash
git switch main
git pull
```

## 2. Crea il tuo branch

Ogni branch corrisponde a **un solo task Jira**. Il nome segue questo formato:

```
<tipo>/<ID-Jira>-<descrizione-breve>
```

| Tipo | Quando si usa | Esempio |
|---|---|---|
| `feature` | nuova funzionalità | `feature/CP-12-pubblicazione-viaggio` |
| `fix` | correzione di un difetto | `fix/CP-30-errore-login` |
| `docs` | documentazione (RAD, SDD, ODD...) | `docs/CP-8-scenari-rad` |
| `test` | solo test | `test/CP-41-test-prenotazione` |

Tutto minuscolo, parole separate da trattini, niente spazi né accenti.

```bash
git switch -c feature/CP-12-pubblicazione-viaggio
```

Il comando crea il branch e ti ci sposta sopra. Per controllare in quale branch sei: `git branch` (quello attuale ha l'asterisco).

## 3. Lavora e fai i commit

Fai commit piccoli e frequenti, ognuno con un messaggio che spiega **cosa** hai fatto:

```bash
git status                     # vedi cosa hai modificato
git add .                      # prepara tutte le modifiche
git commit -m "Aggiunge il form di pubblicazione del viaggio (RF_TRIP_01)"
```

Buoni messaggi: `Aggiunge il controllo dei posti disponibili (RF_TRIP_11)`, `Corregge il redirect dopo il logout`.
Messaggi da evitare: `fix`, `modifiche`, `aaa`, `ultima versione`.

Ricorda di **scrivere i test insieme alla funzionalità**, non alla fine.

## 4. Fai il push del branch

La prima volta che pubblichi il branch su GitHub:

```bash
git push -u origin feature/CP-12-pubblicazione-viaggio
```

Dalle volte successive basta:

```bash
git push
```

## 5. Apri la pull request

1. Vai sul repository su GitHub: comparirà un riquadro giallo con il pulsante **Compare & pull request**. In alternativa: scheda **Pull requests** → **New pull request**, base `main`, compare il tuo branch.
2. **Titolo**: ID Jira e cosa fa, ad esempio `CP-12 Pubblicazione di un viaggio verso la sede`.
3. **Descrizione**, con questa struttura:

```markdown
## Cosa fa
Breve descrizione della modifica.

## Requisiti coinvolti
RF_TRIP_01, RF_TRIP_02

## Come provarla
1. Accedi come conducente con un veicolo associato
2. Vai su "Pubblica viaggio" e compila il form
3. Verifica che il viaggio compaia nella lista

## Test
- [x] Test scritti e superati in locale
```

4. Non serve scegliere il revisore: GitHub assegna in automatico la review ai Project Manager (team `project-managers`, file `.github/CODEOWNERS`).
5. Clicca **Create pull request**.

Se il lavoro non è ancora finito ma vuoi un parere, usa la freccia accanto al pulsante e scegli **Create draft pull request**.

## 6. La review

**Per chi fa la review (Project Manager):**

1. Apri la pull request, scheda **Files changed**. Anche i Team Member possono lasciare commenti, ma l'approvazione che sblocca il merge è solo quella di un PM.
2. Controlla che il codice faccia quello che dice il requisito, che ci siano i test e che sia leggibile.
3. Puoi commentare una singola riga cliccando sul **+** accanto ad essa.
4. Clicca **Review changes** e scegli:
   - **Approve** se va bene;
   - **Request changes** se c'è da correggere, spiegando cosa;
   - **Comment** per domande senza bloccare.

**Per l'autore, se ti chiedono modifiche:** correggi sullo **stesso branch**, poi commit e push. La pull request si aggiorna da sola, non serve aprirne un'altra.

```bash
git add .
git commit -m "Corregge la validazione della data come da review"
git push
```

Poi rispondi ai commenti e clicca **Resolve conversation**.

## 7. Merge nel `main`

Quando la pull request è **approvata da un Project Manager** e non ci sono conflitti:

1. Clicca **Squash and merge** → **Confirm**: tutti i commit del branch diventano un unico commit ordinato nel `main`.
2. Clicca **Delete branch** per cancellare il branch su GitHub.
3. Sul tuo computer, torna al `main` aggiornato e cancella il branch locale:

```bash
git switch main
git pull
git branch -d feature/CP-12-pubblicazione-viaggio
```

4. Aggiorna lo stato del sub-task su Jira e del requisito nel file dei requisiti (`Implementato`).

---

## Problemi frequenti

### Il `main` è andato avanti mentre lavoravi (o GitHub segnala conflitti)

Porta nel tuo branch le novità del `main`:

```bash
git switch main
git pull
git switch feature/CP-12-pubblicazione-viaggio
git merge main
```

Se ci sono **conflitti**, Git ti indica i file coinvolti. Aprili: troverai blocchi così:

```
<<<<<<< HEAD
il tuo codice
=======
il codice arrivato dal main
>>>>>>> main
```

Tieni la versione giusta (o uniscile), cancella le righe `<<<<<<<`, `=======`, `>>>>>>>`, poi:

```bash
git add .
git commit -m "Risolve i conflitti con main"
git push
```

Se non sei sicuro di come risolvere un conflitto, **chiedi sul canale Discord** prima di cancellare codice di altri.

### Ho fatto commit sul `main` per sbaglio (senza push)

```bash
git switch -c feature/CP-12-pubblicazione-viaggio   # sposta il lavoro su un nuovo branch
git switch main
git reset --hard origin/main                         # riporta il main come su GitHub
git switch feature/CP-12-pubblicazione-viaggio
```

### Ho lavorato senza aver fatto `git pull` prima

Nessun problema: segui la procedura «Il `main` è andato avanti».

---

## Riepilogo dei comandi

| Cosa | Comando |
|---|---|
| Aggiornare il main | `git switch main` e `git pull` |
| Creare un branch | `git switch -c feature/CP-XX-descrizione` |
| Vedere le modifiche | `git status` |
| Fare un commit | `git add .` e `git commit -m "messaggio"` |
| Primo push del branch | `git push -u origin <nome-branch>` |
| Push successivi | `git push` |
| Portare il main nel branch | `git merge main` (dal tuo branch) |
| Cancellare
