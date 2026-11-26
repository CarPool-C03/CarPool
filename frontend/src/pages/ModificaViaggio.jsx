import {
  Button,
  Card,
  Field,
  MessageBar,
  MessageBarBody,
  Select,
  Spinner,
  Text,
  Title1,
  makeStyles,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ErroreApi, ErroreValidazione, richiesta } from '../api/client.js';
import CampoModulo from '../components/CampoModulo.jsx';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '20px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', maxWidth: '720px' },
  modulo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  azioni: { display: 'flex', alignItems: 'center', gap: '12px' },
});

function oraEuropeRoma(istante) {
  const parti = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(istante));
  const valore = (tipo) => parti.find((parte) => parte.type === tipo)?.value;
  return {
    data: `${valore('year')}-${valore('month')}-${valore('day')}`,
    ora: `${valore('hour')}:${valore('minute')}`,
  };
}

export default function ModificaViaggio() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { id } = useParams();
  const [caricamento, setCaricamento] = useState(true);
  const [viaggio, setViaggio] = useState(null);
  const [pubblicazione, setPubblicazione] = useState(null);
  const [dati, setDati] = useState({
    puntoPartenza: '', sedeId: '', data: '', ora: '', postiOfferti: '', contributoIndicativoEuro: '',
  });
  const [erroriCampo, setErroriCampo] = useState({});
  const [errore, setErrore] = useState(null);
  const [invio, setInvio] = useState(false);

  useEffect(() => {
    let attivo = true;
    Promise.all([
      richiesta('/api/viaggi/miei'),
      richiesta('/api/viaggi/pubblicazione'),
    ]).then(([elenco, datiPubblicazione]) => {
      const trovato = elenco.attivi.find((elemento) => elemento.id === Number(id));
      if (!trovato) throw new Error('Viaggio attivo non trovato');
      if (attivo) {
        const { data, ora } = oraEuropeRoma(trovato.dataOraPartenza);
        setViaggio(trovato);
        setPubblicazione(datiPubblicazione);
        setDati({
          puntoPartenza: trovato.puntoPartenza,
          sedeId: String(trovato.sede.id),
          data,
          ora,
          postiOfferti: String(trovato.postiOfferti),
          contributoIndicativoEuro: trovato.contributoIndicativoEuro ?? '',
        });
      }
    }).catch((erroreCaricamento) => {
      if (attivo) setErrore({ messaggio: erroreCaricamento.message, api: erroreCaricamento instanceof ErroreApi });
    }).finally(() => {
      if (attivo) setCaricamento(false);
    });
    return () => { attivo = false; };
  }, [id]);

  function cambia(campo, valore) {
    setDati((correnti) => ({ ...correnti, [campo]: valore }));
  }

  async function invia(evento) {
    evento.preventDefault();
    setErroriCampo({});
    setErrore(null);
    setInvio(true);
    try {
      await richiesta(`/api/viaggi/${id}`, {
        metodo: 'PUT',
        corpo: {
          dataOraPartenza: dati.data && dati.ora ? `${dati.data}T${dati.ora}:00` : null,
          puntoPartenza: dati.puntoPartenza,
          sedeId: dati.sedeId === '' ? null : Number(dati.sedeId),
          postiOfferti: dati.postiOfferti === '' ? null : Number(dati.postiOfferti),
          contributoIndicativoEuro: dati.contributoIndicativoEuro === '' ? null : Number(dati.contributoIndicativoEuro),
        },
      });
      navigate('/miei-viaggi');
    } catch (erroreInvio) {
      if (erroreInvio instanceof ErroreValidazione) {
        setErroriCampo(Object.fromEntries(erroreInvio.errori.map(({ campo, messaggio }) => [campo, messaggio])));
      } else setErrore({
        messaggio: erroreInvio.message,
        api: erroreInvio instanceof ErroreApi,
      });
    } finally {
      setInvio(false);
    }
  }

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Modifica viaggio</Title1>
      {errore?.api ? (
        <MessageBar intent="error" role="alert"><MessageBarBody>{errore.messaggio}</MessageBarBody></MessageBar>
      ) : errore && <Text role="alert">{errore.messaggio}</Text>}
      {caricamento ? <Spinner label="Caricamento viaggio" /> : viaggio && (
        <Card className={styles.scheda}>
          <form className={styles.modulo} onSubmit={invia} noValidate>
            <CampoModulo etichetta="Partenza da" nome="puntoPartenza" required maxLength={200}
              errore={erroriCampo.puntoPartenza} value={dati.puntoPartenza}
              onChange={(evento) => cambia('puntoPartenza', evento.target.value)} />
            <Field label="Sede di destinazione" validationMessage={erroriCampo.sedeId}
              validationState={erroriCampo.sedeId ? 'error' : 'none'}>
              <Select value={dati.sedeId} onChange={(evento) => cambia('sedeId', evento.target.value)}>
                <option value="">Seleziona una sede</option>
                {pubblicazione?.sedi.map((sede) => <option key={sede.id} value={sede.id}>{sede.nome}</option>)}
              </Select>
            </Field>
            <CampoModulo etichetta="Data" nome="data" type="date" required value={dati.data}
              errore={erroriCampo.dataOraPartenza} onChange={(evento) => cambia('data', evento.target.value)} />
            <CampoModulo etichetta="Orario di partenza" nome="ora" type="time" required value={dati.ora}
              onChange={(evento) => cambia('ora', evento.target.value)} />
            <CampoModulo etichetta="Posti offerti" nome="postiOfferti" type="number" min={1}
              max={pubblicazione?.postiMassimi} step={1} value={dati.postiOfferti}
              errore={erroriCampo.postiOfferti} onChange={(evento) => cambia('postiOfferti', evento.target.value)} />
            <CampoModulo etichetta="Contributo indicativo (€ / passeggero)" nome="contributo"
              type="number" min={0} step={0.01} value={dati.contributoIndicativoEuro}
              errore={erroriCampo.contributoIndicativoEuro}
              onChange={(evento) => cambia('contributoIndicativoEuro', evento.target.value)} />
            <div className={styles.azioni}>
              <Button appearance="primary" type="submit" disabled={invio || viaggio.richieste.some((r) => r.stato === 'Accettata')}>
                Salva modifiche
              </Button>
              <Link to="/miei-viaggi">Annulla</Link>
            </div>
          </form>
        </Card>
      )}
    </section>
  );
}
