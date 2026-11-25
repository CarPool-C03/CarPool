// Home del Membro: saluto, organizzazione e ricerca di un viaggio.
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  Text,
  Title1,
  Title2,
  makeStyles,
} from '@fluentui/react-components';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useUtente } from '../auth/UtenteContext.jsx';
import { richiesta } from '../api/client.js';

const useStyles = makeStyles({
  pagina: { display: 'flex', flexDirection: 'column', gap: '24px' },
  testata: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ricerca: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' },
  modulo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },
});

export default function Home() {
  const styles = useStyles();
  const { utente } = useUtente();
  const navigate = useNavigate();
  const [zona, setZona] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [data, setData] = useState('');
  const [orarioMinimo, setOrarioMinimo] = useState('');
  const [sedi, setSedi] = useState([]);
  const [sediCaricate, setSediCaricate] = useState(false);
  const [caricamentoSedi, setCaricamentoSedi] = useState(false);
  const [erroreSedi, setErroreSedi] = useState('');

  const nome = utente?.membro?.nome ?? '';

  async function caricaSedi() {
    if (sediCaricate || caricamentoSedi) return;
    setCaricamentoSedi(true);
    try {
      setSedi(await richiesta('/api/sedi'));
      setSediCaricate(true);
      setErroreSedi('');
    } catch (errore) {
      setErroreSedi(errore.message);
    } finally {
      setCaricamentoSedi(false);
    }
  }

  function cerca(evento) {
    evento.preventDefault();
    const parametri = new URLSearchParams({ zona, sedeId, data, orarioMinimo });
    navigate(`/ricerca?${parametri.toString()}`);
  }

  return (
    <section className={styles.pagina}>
      <div className={styles.testata}>
        <div>
          <Title1 as="h1">Ciao {nome}, dove vai?</Title1>
          {utente?.organizzazione && (
            <Text>
              {utente.organizzazione.denominazione}{' '}
              <Badge appearance="filled" color="success">
                Comunità verificata
              </Badge>
            </Text>
          )}
        </div>
        <Button appearance="primary" onClick={() => navigate('/viaggi/nuovo')}>
          Pubblica un viaggio
        </Button>
      </div>
      <Card className={styles.ricerca}>
        <Title2 as="h2">Trova un viaggio verso la tua sede</Title2>
        <form className={styles.modulo} onSubmit={cerca}>
          <Field label="Partenza">
            <Input
              name="zona"
              required
              value={zona}
              onChange={(e) => setZona(e.target.value)}
            />
          </Field>
          <Field
            label="Destinazione"
            validationMessage={erroreSedi || undefined}
            validationState={erroreSedi ? 'error' : 'none'}
          >
            <Select
              name="sedeId"
              required
              value={sedeId}
              onFocus={caricaSedi}
              onChange={(e) => setSedeId(e.target.value)}
            >
              <option value="">
                {caricamentoSedi ? 'Caricamento sedi…' : 'Seleziona una sede'}
              </option>
              {sedi.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data">
            <Input
              name="data"
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </Field>
          <Field label="Orario">
            <Input
              name="orarioMinimo"
              type="time"
              required
              value={orarioMinimo}
              onChange={(e) => setOrarioMinimo(e.target.value)}
            />
          </Field>
          <Button appearance="primary" type="submit" disabled={!sediCaricate || !sedeId}>
            Cerca
          </Button>
        </form>
      </Card>
    </section>
  );
}
