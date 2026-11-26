# Audit UI CarPool

CarPool è la web app React e Fluent UI del progetto C03 UniSa. I membri verificati di aziende e atenei cercano e offrono passaggi verso sedi o eventi. I Mobility Manager consultano report PSCL aggregati e gli amministratori gestiscono organizzazioni e ruoli.

| Priorità | Dove | Problema | Intervento |
| --- | --- | --- | --- |
| Alta | Layout, menu, pagina iniziale | Margini negativi divergenti dal contenitore e navigazione al limite su schermi stretti; la pagina corrente è poco evidente | Contenitore fluido, breakpoint comune, menu attivo riconoscibile e accesso rapido al contenuto |
| Alta | Tema, CTA, form | Verdi locali e Fluent disallineati, con contrasto debole su alcune CTA. Griglie e campi possono eccedere il contenitore | Palette e tema condivisi, focus visibile, colonne minime adattive e campi resilienti |
| Alta | Pagina iniziale, Home, ricerca | Poco risalto a ricerca, pubblicazione e percorso del viaggio | Gerarchia delle azioni, superficie distinta per la ricerca e schede incentrate sul tragitto |
| Media | Ricerca, prenotazioni, login | Attesa, errori e assenza di risultati hanno poco peso visivo; in alcuni casi manca un annuncio dedicato | Stato di caricamento, avviso di errore e superfici per stati vuoti con regioni live |
| Media | Form e pagine operative | Raggi, spaziature e superfici divergenti; URL e nomi lunghi fragili | Token Fluent e CSS, spaziature e ritorni a capo coerenti |
| Bassa | Shell e metadati | Favicon assente, titolo generico sulle rotte e feedback di interazione discontinuo | Favicon con asset esistente, titoli di rotta, transizioni brevi e movimento ridotto |

Il perimetro include presentazione React, CSS, asset pubblici e metadati HTML. Il client API, la gestione della sessione, le protezioni delle rotte e le regole dei viaggi restano al confine con i servizi esistenti.

## Interventi realizzati

- **Tema e layout.** Tema Fluent verde condiviso, spaziature e durata delle transizioni in CSS. Intestazione fluida, pagina corrente evidenziata, focus visibile e link «Vai al contenuto». Le transizioni dei controlli vengono disattivate con movimento ridotto.
- **Pagina iniziale.** Hero con esempio di tragitto, gerarchia più chiara tra registrazione e accesso, tre passaggi con intestazioni semantiche e senza numerazione decorativa.
- **Home e ricerca.** Modulo di ricerca più riconoscibile, griglie adattive, risultati con il tragitto come titolo e orario nel markup semantico. Messaggi di attesa e di errore annunciati. Lo stato vuoto ha una superficie dedicata.
- **Accesso, registrazione, profilo e pubblicazione.** Colori del tema nei link e nei feedback, schede più compatte sugli schermi stretti, attesa annunciata su accesso e registrazione. Le validazioni esistenti restano associate ai loro campi.
- **Report PSCL.** Valori aggregati in evidenza, tabella con spaziatura fluida. Favicon dal marchio già fornito e titoli del browser per le rotte esistenti.

## File creati e separati

- `UI_AUDIT.md`
- `frontend/src/styles/tema.js` e `frontend/src/styles/base.css`, con tema e regole comuni. Il tema è stato estratto da `main.jsx`.
- `frontend/src/layout/TitoloPagina.jsx`, con i titoli delle rotte.
- `frontend/src/pages/paginaIniziale.css`, con gli stili estratti da `PaginaIniziale.jsx`.
- `frontend/src/components/AvvisoErrore.jsx`, condiviso da ricerca e riepilogo prenotazioni.

Nessun file rinominato e nessuna dipendenza aggiunta. Ogni file creato o modificato rientra nel limite di 200 righe.

## Perimetro verificato

Nessun file backend è stato modificato. Sono esclusi `backend/` e le sue sottocartelle per server, route, persistenza, migrazioni, seed e test. Restano esclusi anche `docs/api/`, `docs/modelli/`, `docs/sdd/`, `scripts/`, `.github/`, `.opencode/`, il repository annidato `CarPool/`, `docker-compose.yml` e le configurazioni d’ambiente e deploy.

Nel frontend sono esclusi `src/api/`, `src/auth/`, `src/components/RottaProtetta.jsx` e `vite.config.js`. I campi, gli endpoint, i payload e le chiamate API esistenti sono invariati.

## Lacune residue e passi successivi

- Gli stati e i componenti delle pagine secondarie ereditano il tema comune. L’uniformazione puntuale degli stati vuoti e di conferma nelle aree amministrative, valutazioni e richieste richiede una revisione dedicata dei relativi flussi.
- Il logo esistente pesa circa 32 kB e ora ha dimensioni esplicite nell’intestazione. Una risorsa vettoriale del marchio richiederebbe il sorgente ufficiale.
- Vite segnala il bundle principale oltre 500 kB minificati. Come intervento separato, valutare il caricamento per rotta e misurare la differenza sul primo accesso.
- Restano da misurare la conformità WCAG AA sull’intero prodotto e i percorsi da tastiera con tecnologie assistive reali, incluse le schermate protette e i dati lunghi.

## Verifiche

- Build e lint frontend completati.
- Vitest frontend, 25 suite e 53 test superati.
- Edge headless, pagina iniziale, accesso, registrazione, Home e ricerca a 360, 768 e 1440 px. Verificati visualizzazione, titoli e assenza di overflow orizzontale. Home e ricerca usano risposte API fittizie.
- Verificato da tastiera che «Vai al contenuto» riceve il primo focus e che Invio lo sposta sul contenuto principale.
- Contrasto calcolato per i colori del tema. Testo bianco su CTA primaria 6,45:1 e su sfondo del hero 12,91:1. Testo secondario sullo sfondo app 6,46:1.
