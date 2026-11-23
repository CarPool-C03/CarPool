# Ambiente di test comune

<!-- Copia testuale del paragrafo 2.3 del TCS (C03-TCS-ver0.2.0). Se cambia qui, si aggiorna anche il TCS su Google Drive, nella stessa PR. -->

## Ambiente richiesto

Salvo diversa indicazione nel caso d'uso, ogni caso di test richiede il seguente ambiente:

- **Database**: istanza PostgreSQL dedicata ai test (servizio della CI), svuotata e ripopolata prima di ogni caso di test; nessun caso di test dipende dai dati lasciati da un altro.
- **Organizzazione partner di prova**: «Università degli Studi di Salerno», dominio e-mail autorizzato studenti.unisa.it, sedi «Campus di Fisciano» e «Campus di Baronissi».
- **Membri di prova** (dati fittizi): Luca Verdi (Conducente, luca.verdi@studenti.unisa.it, veicolo con 4 posti passeggeri), Anna Bianchi e Marco Russo (Passeggeri), Sara Galli (Membro), Paolo Neri (Mobility Manager). Tutti con account nello stato «Attivo».
- **Servizio E-mail**: sostituito da uno stub che registra ogni richiesta di invio (destinatario, tipo di messaggio, istante) senza inviare e-mail reali.
- **Orologio**: data e ora correnti fissate dal test a 01/12/2026 ore 10:00 (fuso Europe/Rome), così che i controlli su date e orari diano sempre lo stesso esito.
- **Dati personali**: solo dati fittizi; nessuna credenziale reale nel codice dei test.
