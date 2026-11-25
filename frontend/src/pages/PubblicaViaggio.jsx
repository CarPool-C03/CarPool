import {
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Select,
  Spinner,
  Text,
  Title1,
  makeStyles,
  Field,
  Input,
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ErroreApi, ErroreValidazione, richiesta } from '../api/client.js';
import CampoModulo from '../components/CampoModulo.jsx';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '24px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', maxWidth: '720px' },
  modulo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  ora: { gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  erroreOra: { gridColumn: '1 / -1' },
  azioni: { gridColumn: '1 / -1', display: 'flex', gap: '12px', alignItems: 'center' },
});

function messaggi(errori) {
  return Object.fromEntries(errori.map(({ campo, messaggio }) => [campo, messaggio]));
}

export default function PubblicaViaggio() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [caricamento, setCaricamento] = useState(true);
  const [pubblicazione, setPubblicazione] = useState(null);
  const [profilo, setProfilo] = useState(null);
  const [erroreVeicolo, setErroreVeicolo] = useState('');
  const [errore, setErrore] = useState('');
  const [dati, setDati] = useState({
    puntoPartenza: '', sedeId: '', data: '', ora: '', postiOfferti: '', contributoIndicativoEuro: '',
  });
  const [erroriCampo, setErroriCampo] = useState({});
  const [invio, setInvio] = useState(false);

  useEffect(() => {
    let attivo = true;
    richiesta('/api/viaggi/pubblicazione')
      .then(async (datiPubblicazione) => {
        const datiProfilo = await richiesta('/api/profilo');
        if (attivo) {
          setPubblicazione(datiPubblicazione);
          setProfilo(datiProfilo);
        }
      })
      .catch((erroreCaricamento) => {
        if (!attivo) return;
        if (erroreCaricamento instanceof ErroreApi && erroreCaricamento.stato === 409) {
          setErroreVeicolo(erroreCaricamento.message);
        } else setErrore(erroreCaricamento.message);
      })
      .finally(() => {
        if (attivo) setCaricamento(false);
      });
    return () => { attivo = false; };
  }, []);

  function cambia(campo, valore) {
    setDati((correnti) => ({ ...correnti, [campo]: valore }));
  }

  async function invia(evento) {
    evento.preventDefault();
    setErroriCampo({});
    setErrore('');
    setInvio(true);
    try {
      const viaggio = await richiesta('/api/viaggi', {
        metodo: 'POST',
        corpo: {
          dataOraPartenza: dati.data && dati.ora ? `${dati.data}T${dati.ora}:00` : null,
          puntoPartenza: dati.puntoPartenza,
          sedeId: dati.sedeId === '' ? null : Number(dati.sedeId),
          postiOfferti: dati.postiOfferti === '' ? null : Number(dati.postiOfferti),
          contributoIndicativoEuro: dati.contributoIndicativoEuro === '' ? null : Number(dati.contributoIndicativoEuro),
        },
      });
      navigate(`/viaggi/${viaggio.id}`);
    } catch (erroreInvio) {
      if (erroreInvio instanceof ErroreValidazione) setErroriCampo(messaggi(erroreInvio.errori));
      else if (erroreInvio instanceof ErroreApi) setErrore(erroreInvio.message);
      else setErrore(erroreInvio.message);
    } finally {
      setInvio(false);
    }
  }

  if (caricamento) return <Spinner label="Caricamento pubblicazione" />;
  if (erroreVeicolo) {
    return (
      <Card className={styles.scheda}>
        <Title1 as="h1">Pubblica un viaggio</Title1>
        <MessageBar intent="warning"><MessageBarBody>{erroreVeicolo}</MessageBarBody></MessageBar>
        <Link to="/profilo/veicolo">Inserisci i dati del veicolo</Link>
      </Card>
    );
  }
  if (errore) return <MessageBar intent="error"><MessageBarBody>{errore}</MessageBarBody></MessageBar>;

  return (
    <section className={styles.pagina}>
      <Title1 as="h1">Pubblica un viaggio</Title1>
      <Card className={styles.scheda}>
        <Text weight="semibold">Nuovo annuncio</Text>
        <Text weight="semibold">
          Veicolo: {profilo?.veicolo?.modello} · {pubblicazione?.postiMassimi} posti passeggeri
        </Text>
        <form className={styles.modulo} onSubmit={invia} noValidate>
          <CampoModulo etichetta="Partenza da" nome="puntoPartenza" maxLength={200} required
            errore={erroriCampo.puntoPartenza} value={dati.puntoPartenza}
            onChange={(evento) => cambia('puntoPartenza', evento.target.value)} />
          <Field label="Sede di destinazione" validationMessage={erroriCampo.sedeId}
            validationState={erroriCampo.sedeId ? 'error' : 'none'}>
            <Select name="sedeId" required value={dati.sedeId}
              onChange={(evento) => cambia('sedeId', evento.target.value)}>
              <option value="">Seleziona una sede</option>
              {pubblicazione?.sedi.map((sede) => <option key={sede.id} value={sede.id}>{sede.nome}</option>)}
            </Select>
          </Field>
          <div className={styles.ora}>
            <CampoModulo etichetta="Data" nome="data" type="date" required
              errore={undefined} value={dati.data} onChange={(evento) => cambia('data', evento.target.value)} />
            <CampoModulo etichetta="Orario di partenza" nome="ora" type="time" required
              errore={undefined} value={dati.ora} onChange={(evento) => cambia('ora', evento.target.value)} />
            {erroriCampo.dataOraPartenza && <Text className={styles.erroreOra} role="alert" style={{ color: '#a4262c' }}>{erroriCampo.dataOraPartenza}</Text>}
          </div>
          <CampoModulo etichetta="Posti offerti" nome="postiOfferti" type="number" min={1} max={pubblicazione?.postiMassimi} step={1}
            errore={erroriCampo.postiOfferti} value={dati.postiOfferti}
            onChange={(evento) => cambia('postiOfferti', evento.target.value)} />
          <CampoModulo etichetta="Contributo spese indicativo (€ / passeggero, Facoltativo)" nome="contributo"
            type="number" min={0} step={0.01} errore={erroriCampo.contributoIndicativoEuro}
            value={dati.contributoIndicativoEuro}
            onChange={(evento) => cambia('contributoIndicativoEuro', evento.target.value)} />
          <div className={styles.azioni}>
            <Button appearance="primary" type="submit" disabled={invio}>Pubblica un viaggio</Button>
            <Link to="/miei-viaggi">I miei viaggi</Link>
          </div>
        </form>
      </Card>
    </section>
  );
}
