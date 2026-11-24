# Mockup e path navigazionale (descrizione testuale)

Trascrizione della Sez. 3.4.5 del RAD. **Questo testo è la specifica**; le immagini accanto servono
solo a vedere l'aspetto. Dove il RAD non ha un mockup (segnato «senza mockup»), vale questa descrizione.
Dati e campi: `docs/api/`. Funzioni con priorità Bassa o Media (eventi, esportazione, modifica e
rimozione del veicolo, feedback ricevuti, modifica dei dati personali) **non sono nella beta**: la voce
o il pulsante non si mostra.

## Aspetto comune

- Fluent UI con tema chiaro e colore principale verde come nei mockup; pulsante principale pieno
  verde, secondario bianco con bordo.
- Intestazione: logo «CarPool» a sinistra (porta a `/` o `/home`), voci del menu, «Esci» a destra.
- Ogni pagina: titolo grande, contenuto in riquadri bianchi con bordo arrotondato.
- Errori di un modulo: sotto il campo (componente `CampoModulo`); errori `409`: messaggio sopra il
  pulsante (`MessageBar` di Fluent).
- Date mostrate come «13 novembre · 08:00»; tragitto come «puntoPartenza → nome sede»; stati con un
  badge: In attesa (giallo), Accettata e Completata (verde), Rifiutata e Annullata (grigio).

## Menu e percorsi (`00-path-navigazionale.png`, `00-path-amministratore.png`)

| Ruolo | Voci del menu | Dopo il login |
|---|---|---|
| Visitatore | sottotitolo «Condividi il tragitto nella tua comunità», pulsanti Accedi, Registrati | — |
| Membro | Home, Cerca viaggi, I miei viaggi, Profilo e veicolo, Esci | `/home` |
| Mobility Manager | come il Membro, più «Report PSCL» prima di «Profilo e veicolo» | `/home` |
| Amministratore | Dashboard, Organizzazioni, Membri e ruoli, Esci | `/admin` |

«Esci» chiude la sessione e porta a `/`. Rotta protetta senza utente → `/login`; ruolo non ammesso → `/`.

| Percorso | Pagina | Ruoli | Issue |
|---|---|---|---|
| `/` | Pagina iniziale | tutti | #9 |
| `/login` | Login | visitatore | #13 |
| `/registrazione`, `/registrazione/inviata` | Registrazione, «Controlla la tua e-mail» | visitatore | #12 |
| `/verifica?token=…` | Esito della verifica | tutti | #12 |
| `/home` | Home del Membro | Membro | #9 (riquadri: #17, #19) |
| `/ricerca` | Cerca viaggi e risultati | Membro | #17 |
| `/viaggi/nuovo` | Pubblica un viaggio | Membro | #16 |
| `/viaggi/:id` | Dettaglio viaggio (con «Richiedi posto») | Membro | #16 (pulsante: #19) |
| `/miei-viaggi`, `/miei-viaggi/:id/modifica` | I miei viaggi, modifica | Membro | #18 |
| `/miei-viaggi/:id/richieste` | Richieste ricevute | Membro | #18 (pulsanti: #20) |
| `/prenotazioni` | Le mie prenotazioni | Membro | #19 |
| `/valutazioni`, `/valutazioni/:viaggioId` | Da valutare, Valuta un partecipante | Membro | #24 |
| `/profilo`, `/profilo/veicolo` | Profilo e veicolo | Membro | #15 (eliminazione: #23) |
| `/report` | Report PSCL | Mobility Manager | #21 |
| `/admin`, `/admin/organizzazioni`, `/admin/organizzazioni/nuova`, `/admin/organizzazioni/:id`, `/admin/membri` | Amministrazione | Amministratore | #14 |

## Pagine

**Pagina iniziale** (`01`): sopratitolo «Viaggi condivisi · Aziende e università», titolo «La stessa
destinazione. Un viaggio da condividere.», testo di presentazione, pulsanti «Unisciti alla comunità»
(→ `/registrazione`) e «Ho già un account» (→ `/login`), tre riquadri «01 / Entra · Verifica la tua
e-mail», «02 / Organizza · Cerca o offri un passaggio», «03 / Condividi · Viaggia insieme».

**Login** (`02`): a sinistra «Bentornato in CarPool.» e l'avviso «Puoi accedere dopo aver verificato
l'e-mail della tua organizzazione»; a destra riquadro «Accedi a CarPool» con E-mail istituzionale /
aziendale, Password, pulsante «Accedi», link «Non hai un account? Registrati». «Password dimenticata?»
non è nella beta (RF_AUTH_10, Bassa).

**Registrazione** (`03`): riquadro «Crea un account» con Nome, Cognome (affiancati), E-mail
istituzionale / aziendale, Password, pulsante «Crea account», testo «Riceverai un link via e-mail…»,
link «Hai già un account? Accedi». Dopo l'invio → `/registrazione/inviata` («Controlla la tua e-mail»).
**Verifica** (senza mockup): mostra «Account attivato» con link ad Accedi, oppure il messaggio di link
non valido.

**Home** (`04`): «Ciao <nome>, dove vai?», organizzazione con badge «Comunità verificata», pulsante
«Pubblica un viaggio» (→ `/viaggi/nuovo`). Riquadro «Trova un viaggio verso la tua sede» con Partenza,
Destinazione (sedi), Data, Orario e «Cerca» (→ `/ricerca` con i filtri). Riquadro «Il tuo prossimo
viaggio»: la richiesta `Accettata` con partenza futura più vicina (data, tragitto, «Con <conducente>»,
«Dettaglio viaggio»). Riquadro «Le tue richieste»: la richiesta `InAttesa` più vicina con «Le mie
prenotazioni». Senza dati: riquadro con un testo vuoto. Il riquadro Eventi non è nella beta.

**Cerca viaggi** (`05`): filtri Zona di partenza, Sede di destinazione, Data, Orario e «Cerca»;
«Viaggi disponibili» con una scheda per viaggio: badge «Posti disponibili: N», data e ora, tragitto,
«Con <nome cognome> · Contributo indicativo: 3 €» (o «non indicato»), pulsante «Dettaglio viaggio».
Nessun risultato: «Nessun viaggio disponibile per i filtri inseriti».

**Pubblica un viaggio** (`06`): riquadro «Nuovo annuncio» con badge «Veicolo: <modello> · N posti
passeggeri»; campi Partenza da, Sede di destinazione, Data, Orario di partenza, Posti offerti ai
passeggeri (massimo = posti del veicolo), Contributo spese indicativo (€ / passeggero, «Facoltativo»);
nota «I posti offerti non possono superare…»; pulsante «Pubblica un viaggio»; link «I miei viaggi».
Il campo Tipologia (verso evento) non è nella beta. Senza veicolo (`409 VEICOLO_ASSENTE`): al posto del
modulo l'avviso «Per pubblicare un viaggio inserisci prima i dati del veicolo» con link a `/profilo/veicolo`.

**Dettaglio viaggio** (senza mockup): tragitto, data e ora, conducente, posti disponibili, contributo,
stato. Pulsante «Richiedi posto» se il viaggio è `Attivo`, non è proprio e ha posti; dopo la richiesta,
badge «In attesa».

**I miei viaggi** (senza mockup): schede Attivi e Conclusi; per ogni viaggio tragitto, data, posti
disponibili, numero di richieste in attesa, pulsanti «Richieste ricevute», «Modifica» (disattivato con
richieste accettate) e «Cancella» (con finestra di conferma).

**Richieste ricevute** (`07`): riquadro del viaggio con tragitto, badge «Posti residui: N», «data · ora
· Conducente: <nome>»; per ogni richiesta nome del passeggero, «Stato: <stato>» e, se `InAttesa`,
pulsanti «Accetta» e «Rifiuta»; nota «La conferma è possibile solo per un viaggio attivo con posti
residui». Link «I miei viaggi».

**Le mie prenotazioni** (senza mockup): elenco delle richieste con tragitto, data, conducente, badge
dello stato e pulsante «Annulla» per quelle `InAttesa` o `Accettata` di viaggi non conclusi.

**Valuta un partecipante** (`08`): a sinistra il viaggio (badge «Viaggio concluso», tragitto, Data,
Conducente, Passeggero, Prenotazione) e la nota «La valutazione è consentita una sola volta…»; a
destra «La tua valutazione» con Partecipante da valutare (elenco «Nome Cognome · Conducente» o
«· Passeggero»), Punteggio (1–5) (elenco a discesa), Commento (facoltativo, «Com'è andato il
viaggio?»), pulsante «Invia valutazione». `/valutazioni` (senza mockup) elenca i viaggi da valutare.

**Report PSCL** (`09`): «Genera statistiche aggregate» con Sede dell'organizzazione, Data di inizio,
Data di fine, «Genera report» e la nota sul periodo e sull'anonimato; tre riquadri «Viaggi condivisi»,
«Posti offerti», «Passeggeri trasportati» con «Nel periodo selezionato»; sotto, la tabella per mese.
«Esporta report» non è nella beta (RF_ORG_02, Bassa).

**Profilo e veicolo** (`10`): menu laterale Dati personali, Il mio veicolo, Le mie prenotazioni (→
`/prenotazioni`). Dati personali: Nome, Cognome, E-mail verificata e organizzazione **in sola lettura**,
sezione «Account» con «Richiedi cancellazione account» (finestra con password, #23). Il mio veicolo:
Modello, Colore, Posti passeggeri (conducente escluso), nota sui posti, «Salva veicolo»; con un
veicolo già registrato i campi sono in sola lettura e il pulsante non c'è.

**Dashboard amministratore** (`11`): due riquadri «Gestione partner» (→ `/admin/organizzazioni`) e
«Mobility Manager» (→ `/admin/membri`). Organizzazioni (senza mockup): elenco, «Nuova organizzazione»
(denominazione, sedi e domini aggiungibili), dettaglio in sola lettura. Membri e ruoli (senza mockup):
ricerca per e-mail, elenco con stato e ruolo, «Assegna Mobility Manager» con conferma.
