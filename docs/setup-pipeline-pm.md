# Configurazione della pipeline agentica (solo PM)

Si fa una volta sola. Tutto ciò che sta nel repository è già pronto (agent file,
workflow, moduli, template); qui restano le **impostazioni** e i **secret**, che
non si versionano. Serve il ruolo Admin sul repository.

## 1. Label delle fasi
```bash
gh auth login
bash scripts/setup-labels.sh CarPool-C03/CarPool
```
Crea `task-agente`, `task`, `fase:piano`, `fase:implementazione`, `fase:test`,
`fase:revisione`, `prova`. Solo chi ha accesso Write può aggiungere label, quindi
un esterno non può avviare un agente.

## 2. Modello per OpenCode in GitHub Actions
I workflow degli agenti OpenCode restano **spenti (skipped)** finché non si
imposta la variabile `OPENCODE_MODEL`. Settings → Secrets and variables →
Actions → scheda *Variables* → New repository variable.

| Opzione | `OPENCODE_MODEL` | Secret da creare (scheda *Secrets*) |
|---|---|---|
| OpenCode Zen (modelli gratuiti del catalogo Zen) | `opencode/<modello>` | `OPENCODE_API_KEY` (da opencode.ai, *API Keys*) |
| GitHub Models (quota gratuita, usa il token del workflow) | `github-models/<publisher>/<modello>` | nessuno (i workflow hanno già `models: read`) |
| Altro provider a pagamento | `anthropic/...`, `openai/...`, `google/...`, `openrouter/...` | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` o `OPENROUTER_API_KEY` |

Vincolo di progetto: solo piani gratuiti, quindi una delle prime due righe.
Il nome esatto del modello si legge con `opencode models` in locale.
Regole sulla chiave: mai nel codice, in un `.env` versionato o in chat; una
chiave per team; se esce dove non deve, si revoca e si sostituisce il secret.
Se il provider lo permette, impostare un **limite di spesa**.

## 3. Permessi dei workflow
Settings → Actions → General → *Workflow permissions*:
- **Read repository contents and packages permissions** (sola lettura di default);
- abilitare **Allow GitHub Actions to create and approve pull requests**.
Ogni workflow chiede i permessi in più nel proprio blocco `permissions`.

## 4. Copilot coding agent
1. Ogni membro attiva il **GitHub Student Developer Pack** (include Copilot Pro).
2. Il coding agent deve essere abilitato per il repository (impostazioni Copilot
   dell'organizzazione CarPool-C03 → Coding agent → repository abilitati).
3. Il file `.github/workflows/copilot-setup-steps.yml` prepara Node sul runner;
   provarlo da *Actions → Copilot Setup Steps → Run workflow*.
4. Gli agenti personalizzati sono in `.github/agents/` e compaiono quando si
   assegna un'issue a Copilot e in VS Code.

## 5. Ruleset su `main` (`protezione-main`, già attivo)
Settings → Rules → Rulesets → protezione-main. Già presenti: niente cancellazione,
niente force push, PR obbligatoria con 1 approvazione e review dei Code Owners.
**Dopo il merge di questa configurazione** aggiungere:
- *Dismiss stale pull request approvals when new commits are pushed*
  (un'approvazione non resta valida dopo nuovi commit, per esempio di un agente);
- *Require status checks to pass* → aggiungere il controllo **`build`**
  (compare nell'elenco solo dopo che la CI ha girato almeno una volta).
Con il controllo richiesto, una PR con la CI rossa non si può unire.

## 6. Prova della pipeline
1. Apri un'issue qualsiasi e aggiungi la label `prova`: deve comparire il
   commento «Ciao!». Se sì, eventi, condizioni e permessi funzionano.
2. Apri un'issue dal modulo **Task per agente** con un caso d'uso piccolo e
   aggiungi `fase:piano`. In *Actions* compare «Agente pianificatore»; nel log
   si vedono i file letti. A fine run il piano è nei commenti dell'issue.
3. Se il job è *skipped*: label diversa o `OPENCODE_MODEL` mancante.
   Se fallisce con errore di autenticazione: secret o modello.

## 7. GitHub Projects (vista del PM)
Projects → New project → Board → collegare il repository.
- Colonne (campo Status): Da pianificare, Piano, Implementazione, Test, Revisione, Fatto.
- Campi: Task Jira (testo), Caso d'uso (testo), Agente (Copilot/OpenCode/locale), Tentativi (numero).
- Workflows del progetto: *Auto-add* con filtro `label:task-agente`; *Item closed*
  e *Pull request merged* spostano in Fatto.

Ricerche utili da salvare come viste:
| Domanda | Ricerca |
|---|---|
| Task da avviare | `is:issue is:open label:task-agente -label:"fase:piano"` |
| Piani da approvare | `is:issue is:open label:"fase:piano" -label:"fase:implementazione"` |
| PR in bozza | `is:pr is:open draft:true` |
| PR da rivedere | `is:pr is:open draft:false review:required` |
| PR con CI rossa | `is:pr is:open status:failure` |

## 8. Sicurezza
- Gli agenti partono solo da label (Write) o da commenti di OWNER/MEMBER/COLLABORATOR.
- Le PR da fork non ricevono secret e i workflow degli agenti le ignorano.
  Non usare mai `pull_request_target` per gli agenti.
- `CODEOWNERS` protegge `AGENTS.md`, `opencode.json`, `.opencode/`, `.github/`:
  un agente o uno studente non può cambiarli senza l'approvazione di un PM.
- Il repository è pubblico: chiunque legge issue e commenti, quindi niente dati
  personali reali né credenziali; dati di test fittizi.

## 9. Metriche (dal template delle PR e dalla board)
PR accettate al primo giro · giri di revisione per PR · test frame coperti /
totali · CI rossa al primo push · difetti dopo il merge · PR che modificano
`docs/modelli/`. Servono a migliorare il processo, non a valutare le persone.

## Lista di controllo finale
- [ ] Label create (`gh label list`)
- [ ] `OPENCODE_MODEL` impostata ed eventuale secret della chiave
- [ ] Workflow permissions in sola lettura, creazione di PR consentita
- [ ] Copilot coding agent abilitato; *Copilot Setup Steps* verde
- [ ] Ruleset: dismiss stale approvals + status check `build`
- [ ] Prova `prova` e `fase:piano` riuscite
- [ ] Board collegata con Auto-add
