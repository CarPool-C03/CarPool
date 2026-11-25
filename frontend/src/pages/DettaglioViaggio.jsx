import {
  Badge,
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  Title1,
  makeStyles,
} from '@fluentui/react-components';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useUtente } from '../auth/UtenteContext.jsx';
import { richiesta } from '../api/client.js';
import { contributoMostrato, dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '24px' },
  scheda: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '24px',
    maxWidth: '720px',
  },
});

const ETICHETTE_STATO = {
  InAttesa: 'In attesa',
  Accettata: 'Accettata',
  Rifiutata: 'Rifiutata',
  Annullata: 'Annullata',
  Completata: 'Completata',
};

function coloreStato(stato) {
  if (stato === 'InAttesa') return 'warning';
  if (stato === 'Accettata' || stato === 'Completata') return 'success';
  return 'subtle';
}

export default function DettaglioViaggio() {
  const styles = useStyles();
  const { id } = useParams();
  const { utente } = useUtente();
  const [dettaglio, setDettaglio] = useState(null);
  const [idInvio, setIdInvio] = useState(null);
  const generazione = useRef(0);

  useEffect(() => {
    const generazioneCorrente = generazione.current + 1;
    generazione.current = generazioneCorrente;
    let attivo = true;

    Promise.all([
      richiesta(`/api/viaggi/${id}`),
      richiesta('/api/richieste/mie'),
    ])
      .then(([datiViaggio, datiRichieste]) => {
        if (
          !Number.isSafeInteger(Number(id)) ||
          !Number.isSafeInteger(datiViaggio?.id) ||
          datiViaggio.id !== Number(id) ||
          !datiViaggio.conducente ||
          typeof datiViaggio.puntoPartenza !== 'string' ||
          !Array.isArray(datiRichieste?.richieste)
        ) {
          throw new Error('Risposta non valida durante il caricamento del viaggio');
        }
        if (!attivo || generazione.current !== generazioneCorrente) return;
        const esistente = datiRichieste.richieste.find((elemento) => (
          elemento?.viaggio?.id === datiViaggio.id &&
          ['InAttesa', 'Accettata'].includes(elemento.stato)
        ));
        setDettaglio({
          id,
          viaggio: datiViaggio,
          richiestaAttiva: esistente ?? null,
          errore: null,
        });
      })
      .catch((erroreCaricamento) => {
        if (attivo && generazione.current === generazioneCorrente) {
          setDettaglio({
            id,
            viaggio: null,
            richiestaAttiva: null,
            errore: {
              fase: 'caricamento',
              messaggio: erroreCaricamento.message,
              stato: erroreCaricamento?.stato ?? null,
            },
          });
        }
      });

    return () => {
      attivo = false;
      if (generazione.current === generazioneCorrente) {
        generazione.current += 1;
      }
    };
  }, [id]);

  async function richiediPosto() {
    const generazioneInvio = generazione.current;
    setIdInvio(id);
    setDettaglio((corrente) => (
      corrente?.id === id ? { ...corrente, errore: null } : corrente
    ));
    try {
      const creata = await richiesta(`/api/viaggi/${id}/richieste`, { metodo: 'POST' });
      if (creata?.stato !== 'InAttesa' || !Number.isSafeInteger(creata.id)) {
        throw new Error('Risposta non valida durante la richiesta del posto');
      }
      if (generazione.current === generazioneInvio) {
        setDettaglio((corrente) => (
          corrente?.id === id
            ? { ...corrente, richiestaAttiva: creata, errore: null }
            : corrente
        ));
      }
    } catch (erroreRichiesta) {
      if (generazione.current === generazioneInvio) {
        setDettaglio((corrente) => (
          corrente?.id === id
            ? {
                ...corrente,
                errore: {
                  fase: 'invio',
                  messaggio: erroreRichiesta.message,
                  stato: erroreRichiesta?.stato ?? null,
                },
              }
            : corrente
        ));
      }
    } finally {
      setIdInvio((corrente) => (corrente === id ? null : corrente));
    }
  }

  const dettaglioCorrente = dettaglio?.id === id ? dettaglio : null;
  const viaggio = dettaglioCorrente?.viaggio ?? null;
  const richiestaAttiva = dettaglioCorrente?.richiestaAttiva ?? null;
  const messaggioErrore = dettaglioCorrente?.errore?.messaggio ?? '';
  const erroreConflitto =
    dettaglioCorrente?.errore?.fase === 'invio' &&
    dettaglioCorrente.errore.stato === 409;
  const caricamento = dettaglioCorrente === null;
  const viaggioProprio = viaggio?.conducente?.id === utente?.membro?.id;
  const mostraPulsante = viaggio?.stato === 'Attivo' && !viaggioProprio && !richiestaAttiva;
  const invio = idInvio === id;

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Dettaglio viaggio</Title1>
      {messaggioErrore && !erroreConflitto && (
        <Text role="alert">{messaggioErrore}</Text>
      )}
      {caricamento ? (
        <Spinner label="Caricamento viaggio" />
      ) : viaggio ? (
        <Card className={styles.scheda}>
          <Text weight="semibold">{dataOraMostrata(viaggio.dataOraPartenza)}</Text>
          <Text>{viaggio.puntoPartenza} → {viaggio.sede?.nome}</Text>
          <Text>
            Conducente: {viaggio.conducente.nome} {viaggio.conducente.cognome}
          </Text>
          <Text>Posti disponibili: {viaggio.postiDisponibili}</Text>
          <Text>{contributoMostrato(viaggio.contributoIndicativoEuro)}</Text>
          <Text>
            Stato:{' '}
            <Badge appearance="filled" color={viaggio.stato === 'Attivo' ? 'success' : 'informative'}>
              {viaggio.stato}
            </Badge>
          </Text>
          {richiestaAttiva && (
            <Badge appearance="filled" color={coloreStato(richiestaAttiva.stato)}>
              {ETICHETTE_STATO[richiestaAttiva.stato] ?? richiestaAttiva.stato}
            </Badge>
          )}
          {erroreConflitto && (
            <MessageBar intent="error" role="alert">
              <MessageBarBody>{messaggioErrore}</MessageBarBody>
            </MessageBar>
          )}
          {mostraPulsante && (
            <Button appearance="primary" disabled={invio} onClick={richiediPosto}>
              {invio ? 'Invio…' : 'Richiedi posto'}
            </Button>
          )}
        </Card>
      ) : !messaggioErrore ? (
        <Text>Viaggio non disponibile.</Text>
      ) : null}
    </section>
  );
}
