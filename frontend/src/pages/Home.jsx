// Home del Membro: saluto, organizzazione e ricerca di un viaggio.
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Text,
  Title1,
  Title2,
  makeStyles,
} from '@fluentui/react-components';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useUtente } from '../auth/UtenteContext.jsx';

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
  const [partenza, setPartenza] = useState('');
  const [destinazione, setDestinazione] = useState('');
  const [data, setData] = useState('');
  const [orario, setOrario] = useState('');

  const nome = utente?.membro?.nome ?? '';

  function cerca(evento) {
    evento.preventDefault();
    const parametri = new URLSearchParams();
    if (partenza) parametri.set('partenza', partenza);
    if (destinazione) parametri.set('destinazione', destinazione);
    if (data) parametri.set('data', data);
    if (orario) parametri.set('orario', orario);
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
            <Input value={partenza} onChange={(e) => setPartenza(e.target.value)} />
          </Field>
          <Field label="Destinazione">
            <Input
              value={destinazione}
              onChange={(e) => setDestinazione(e.target.value)}
            />
          </Field>
          <Field label="Data">
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </Field>
          <Field label="Orario">
            <Input type="time" value={orario} onChange={(e) => setOrario(e.target.value)} />
          </Field>
          <Button appearance="primary" type="submit">
            Cerca
          </Button>
        </form>
      </Card>
    </section>
  );
}
