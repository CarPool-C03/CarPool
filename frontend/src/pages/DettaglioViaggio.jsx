import {
  Badge,
  Button,
  Card,
  Text,
  Title1,
  makeStyles,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useUtente } from '../auth/UtenteContext.jsx';
import { richiesta } from '../api/client.js';
import { contributoMostrato, dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '18px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' },
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
  const [viaggio, setViaggio] = useState(null);
  const [richiestaAttiva, setRichiestaAttiva] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    let attivo = true;
    Promise.all([
      richiesta(`/api/viaggi/${id}`),
      richiesta('/api/richieste/mie'),
    ])
      .then(([datiViaggio, datiRichieste]) => {
        if (
          !Number.isSafeInteger(datiViaggio?.id) ||
          !datiViaggio.conducente ||
          !Array.isArray(datiRichieste?.richieste)
        ) {
          throw new Error('Risposta non valida durante il caricamento del viaggio');
        }
        if (!attivo) return;
        setViaggio(datiViaggio);
        const esistente = datiRichieste.richieste.find((elemento) => (
          elemento.viaggio.id === datiViaggio.id &&
          ['InAttesa', 'Accettata'].includes(elemento.stato)
        ));
        setRichiestaAttiva(esistente ?? null);
      })
      .catch((erroreCaricamento) => {
        if (attivo) setErrore(erroreCaricamento.message);
      })
      .finally(() => {
        if (attivo) setCaricamento(false);
      });
    return () => {
      attivo = false;
    };
  }, [id]);

  async function richiediPosto() {
    setErrore('');
    setInvio(true);
    try {
      const creata = await richiesta(`/api/viaggi/${id}/richieste`, { metodo: 'POST' });
      if (creata?.stato !== 'InAttesa' || !Number.isSafeInteger(creata.id)) {
        throw new Error('Risposta non valida durante la richiesta del posto');
      }
      setRichiestaAttiva(creata);
    } catch (erroreRichiesta) {
      setErrore(erroreRichiesta.message);
    } finally {
      setInvio(false);
    }
  }

  const viaggioProprio = viaggio?.conducente?.id === utente?.membro?.id;
  const mostraPulsante = viaggio?.stato === 'Attivo' && !viaggioProprio && !richiestaAttiva;

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Dettaglio viaggio</Title1>
      {errore && <Text role="alert">{errore}</Text>}
      {caricamento ? (
        <Text>Caricamento…</Text>
      ) : viaggio && (
        <Card className={styles.scheda}>
          <Text>{viaggio.puntoPartenza} → {viaggio.sede?.nome}</Text>
          <Text>{dataOraMostrata(viaggio.dataOraPartenza)}</Text>
          <Text>
            Con {viaggio.conducente.nome} {viaggio.conducente.cognome}
          </Text>
          <Text>Posti disponibili: {viaggio.postiDisponibili}</Text>
          <Text>{contributoMostrato(viaggio.contributoIndicativoEuro)}</Text>
          <Text>Stato: {viaggio.stato}</Text>
          {richiestaAttiva && (
            <Badge appearance="filled" color={coloreStato(richiestaAttiva.stato)}>
              {ETICHETTE_STATO[richiestaAttiva.stato] ?? 'In attesa'}
            </Badge>
          )}
          {mostraPulsante && (
            <Button appearance="primary" disabled={invio} onClick={richiediPosto}>
              {invio ? 'Invio…' : 'Richiedi posto'}
            </Button>
          )}
        </Card>
      )}
    </section>
  );
}
