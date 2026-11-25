import {
  Text,
  Title1,
  Title2,
  makeStyles,
} from '@fluentui/react-components';
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { ErroreValidazione, richiesta } from '../api/client.js';
import FiltroRicerca from './FiltroRicerca.jsx';
import SchedaViaggio from './SchedaViaggio.jsx';
import { leggiFiltri, urlRicerca } from './ricercaUtilita.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '24px' },
  risultati: { display: 'flex', flexDirection: 'column', gap: '16px' },
});

export default function Ricerca() {
  const { search } = useLocation();
  return <RicercaConFiltri key={search} search={search} />;
}

function RicercaConFiltri({ search }) {
  const styles = useStyles();
  const [filtri, setFiltri] = useState(() => leggiFiltri(search));
  const [sedi, setSedi] = useState([]);
  const [errori, setErrori] = useState({});
  const [errore, setErrore] = useState('');
  const [viaggi, setViaggi] = useState(null);
  const [caricamento, setCaricamento] = useState(
    () => Object.values(leggiFiltri(search)).every(Boolean),
  );
  const [caricamentoSedi, setCaricamentoSedi] = useState(true);

  const cercaViaggi = useCallback(async (valori) => {
    setCaricamento(true);
    setErrori({});
    setErrore('');
    try {
      const risposta = await richiesta(urlRicerca(valori));
      if (!Array.isArray(risposta?.viaggi)) {
        throw new Error('Risposta non valida durante la ricerca dei viaggi');
      }
      setViaggi(risposta.viaggi);
    } catch (erroreRicerca) {
      setViaggi(null);
      if (erroreRicerca instanceof ErroreValidazione) {
        setErrori(Object.fromEntries(
          erroreRicerca.errori.map(({ campo, messaggio }) => [campo, messaggio]),
        ));
      } else {
        setErrore(erroreRicerca.message);
      }
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => {
    let attivo = true;
    richiesta('/api/sedi')
      .then((risultato) => {
        if (!Array.isArray(risultato)) {
          throw new Error('Risposta non valida durante il caricamento delle sedi');
        }
        if (attivo) setSedi(risultato);
      })
      .catch((erroreSedi) => {
        if (attivo) setErrore(erroreSedi.message);
      })
      .finally(() => {
        if (attivo) setCaricamentoSedi(false);
      });
    return () => {
      attivo = false;
    };
  }, []);

  useEffect(() => {
    let attivo = true;
    const iniziali = leggiFiltri(search);
    if (!Object.values(iniziali).every(Boolean)) return undefined;
    richiesta(urlRicerca(iniziali))
      .then((risposta) => {
        if (!Array.isArray(risposta?.viaggi)) {
          throw new Error('Risposta non valida durante la ricerca dei viaggi');
        }
        if (attivo) setViaggi(risposta.viaggi);
      })
      .catch((erroreRicerca) => {
        if (!attivo) return;
        setViaggi(null);
        if (erroreRicerca instanceof ErroreValidazione) {
          setErrori(Object.fromEntries(
            erroreRicerca.errori.map(({ campo, messaggio }) => [campo, messaggio]),
          ));
        } else {
          setErrore(erroreRicerca.message);
        }
      })
      .finally(() => {
        if (attivo) setCaricamento(false);
      });
    return () => {
      attivo = false;
    };
  }, [search]);

  function aggiorna(campo, valore) {
    setFiltri((correnti) => ({ ...correnti, [campo]: valore }));
  }

  function invia(evento) {
    evento.preventDefault();
    cercaViaggi(filtri);
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Cerca viaggi</Title1>
      <FiltroRicerca
        filtri={filtri}
        sedi={sedi}
        errori={errori}
        caricamento={caricamento}
        caricamentoSedi={caricamentoSedi}
        onCambia={aggiorna}
        onInvia={invia}
      />

      {errore && <Text role="alert">{errore}</Text>}
      {viaggi !== null && (
        <section className={styles.risultati} aria-live="polite">
          <Title2 as="h2">Viaggi disponibili</Title2>
          {viaggi.length === 0 ? (
            <Text>Nessun viaggio disponibile per i filtri inseriti</Text>
          ) : viaggi.map((viaggio) => (
            <SchedaViaggio key={viaggio.id} viaggio={viaggio} />
          ))}
        </section>
      )}
    </section>
  );
}
