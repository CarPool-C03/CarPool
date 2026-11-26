import {
  Button,
  Card,
  Text,
  Title1,
  makeStyles,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { richiesta } from '../api/client.js';
import { dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '20px' },
  elenco: { display: 'flex', flexDirection: 'column', gap: '14px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' },
});

function rispostaValida(risposta) {
  return Array.isArray(risposta?.daFare) && risposta.daFare.every((elemento) => (
    Number.isInteger(elemento.viaggio?.id)
    && Array.isArray(elemento.persone)
    && elemento.persone.every((persona) => Number.isInteger(persona.membroId))
  ));
}

export default function DaValutare() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [viaggi, setViaggi] = useState(null);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    let attivo = true;
    richiesta('/api/valutazioni/da-fare')
      .then((risposta) => {
        if (!rispostaValida(risposta)) {
          throw new Error('Risposta non valida durante il caricamento delle valutazioni');
        }
        if (attivo) setViaggi(risposta.daFare);
      })
      .catch((erroreCaricamento) => {
        if (attivo) setErrore(erroreCaricamento.message);
      });
    return () => {
      attivo = false;
    };
  }, []);

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Da valutare</Title1>
      {errore && <Text role="alert">{errore}</Text>}
      {viaggi === null ? (
        !errore && <Text>Caricamento…</Text>
      ) : viaggi.length === 0 ? (
        <Text>Non hai partecipanti da valutare</Text>
      ) : (
        <div className={styles.elenco}>
          {viaggi.map(({ viaggio, persone }) => (
            <Card className={styles.scheda} key={viaggio.id}>
              <Text>Viaggio concluso · {dataOraMostrata(viaggio.dataOraPartenza)}</Text>
              {viaggio.sede?.nome && <Text>Destinazione: {viaggio.sede.nome}</Text>}
              <Text>
                {persone.length} {persone.length === 1 ? 'partecipante da valutare' : 'partecipanti da valutare'}
              </Text>
              <Button
                appearance="primary"
                onClick={() => navigate(`/valutazioni/${viaggio.id}`)}
              >
                Valuta partecipanti
              </Button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
