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
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ErroreApi, richiesta } from '../api/client.js';
import { dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '20px' },
  elenco: { display: 'flex', flexDirection: 'column', gap: '12px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' },
  azioni: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
});

function SchedeViaggi({ titolo, viaggi, cancella, eliminazioneId }) {
  const styles = useStyles();
  const navigate = useNavigate();
  return (
    <section className={styles.pagina} aria-label={titolo}>
      <Title1 as="h2">{titolo}</Title1>
      {viaggi.length === 0 ? <Text>Nessun viaggio</Text> : (
        <div className={styles.elenco}>
          {viaggi.map((viaggio) => {
            const richiesteAccettate = viaggio.richieste.some(
              (elemento) => elemento.stato === 'Accettata',
            );
            const richiesteInAttesa = viaggio.richieste.filter(
              (elemento) => elemento.stato === 'InAttesa',
            ).length;
            const attivo = viaggio.stato === 'Attivo';
            return (
              <Card className={styles.scheda} key={viaggio.id}>
                <Text weight="semibold">
                  {viaggio.puntoPartenza} → {viaggio.sede.nome}
                </Text>
                <Text>{dataOraMostrata(viaggio.dataOraPartenza)}</Text>
                <Text>Posti disponibili: {viaggio.postiDisponibili}</Text>
                <Text>Richieste in attesa: {richiesteInAttesa}</Text>
                {!attivo && <Badge>{viaggio.stato}</Badge>}
                <div className={styles.azioni}>
                  <Button onClick={() => navigate(`/miei-viaggi/${viaggio.id}/richieste`)}>
                    Richieste ricevute
                  </Button>
                  <Button
                    disabled={!attivo || richiesteAccettate}
                    aria-label={richiesteAccettate ? 'Modifica disattivato con richieste accettate' : undefined}
                    onClick={() => navigate(`/miei-viaggi/${viaggio.id}/modifica`)}
                  >
                    Modifica
                  </Button>
                  <Button
                    disabled={!attivo || eliminazioneId !== null}
                    onClick={() => cancella(viaggio)}
                  >
                    {eliminazioneId === viaggio.id ? 'Cancellazione…' : 'Cancella'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function IMieiViaggi() {
  const styles = useStyles();
  const [viaggi, setViaggi] = useState(null);
  const [errore, setErrore] = useState('');
  const [eliminazioneId, setEliminazioneId] = useState(null);

  useEffect(() => {
    let attivo = true;
    richiesta('/api/viaggi/miei')
      .then((risposta) => {
        if (!Array.isArray(risposta?.attivi) || !Array.isArray(risposta?.conclusi)) {
          throw new Error('Risposta non valida durante il caricamento dei viaggi');
        }
        if (attivo) setViaggi(risposta);
      })
      .catch((erroreCaricamento) => {
        if (attivo) setErrore({
          messaggio: erroreCaricamento.message,
          api: erroreCaricamento instanceof ErroreApi,
        });
      });
    return () => { attivo = false; };
  }, []);

  async function cancella(viaggio) {
    if (!window.confirm('Vuoi cancellare questo viaggio?')) return;
    setErrore(null);
    setEliminazioneId(viaggio.id);
    try {
      await richiesta(`/api/viaggi/${viaggio.id}`, { metodo: 'DELETE' });
      setViaggi((correnti) => ({
        ...correnti,
        attivi: correnti.attivi.filter((elemento) => elemento.id !== viaggio.id),
      }));
    } catch (erroreCancellazione) {
      setErrore({
        messaggio: erroreCancellazione.message,
        api: erroreCancellazione instanceof ErroreApi,
      });
    } finally {
      setEliminazioneId(null);
    }
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">I miei viaggi</Title1>
      {errore?.api ? (
        <MessageBar intent="error" role="alert"><MessageBarBody>{errore.messaggio}</MessageBarBody></MessageBar>
      ) : errore && <Text role="alert">{errore.messaggio}</Text>}
      {viaggi === null ? <Spinner label="Caricamento dei viaggi" /> : (
        <>
          <SchedeViaggi titolo="Attivi" viaggi={viaggi.attivi} cancella={cancella} eliminazioneId={eliminazioneId} />
          <SchedeViaggi titolo="Conclusi" viaggi={viaggi.conclusi} cancella={cancella} eliminazioneId={eliminazioneId} />
          <Link to="/viaggi/nuovo">Pubblica un viaggio</Link>
        </>
      )}
    </section>
  );
}
