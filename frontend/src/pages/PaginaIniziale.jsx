// Pagina iniziale pubblica: presentazione e accesso alla comunità.
import { Button, Card, Text, Title1, makeStyles } from '@fluentui/react-components';
import { useNavigate } from 'react-router';

const useStyles = makeStyles({
  pagina: {
    display: 'flex',
    flexDirection: 'column',
    gap: '26px',
    margin: '-32px -36px 0',
    minHeight: 'calc(100vh - 60px)',
    padding: '64px 36px 24px',
    backgroundColor: '#F4F7F2',
    '@media (max-width: 600px)': {
      margin: '-32px -24px 0',
      padding: '40px 24px 24px',
    },
  },
  eroe: { display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '820px' },
  sopratitolo: {
    color: '#117F60',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  titolo: {
    color: '#153D34',
    fontSize: '56px',
    fontWeight: 700,
    lineHeight: 1.15,
    '@media (max-width: 600px)': { fontSize: '40px' },
  },
  presentazione: { color: '#61736B', fontSize: '20px', lineHeight: 1.5 },
  azioni: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  azionePrimaria: {
    backgroundColor: '#117F60',
    borderTopColor: '#117F60',
    borderRightColor: '#117F60',
    borderBottomColor: '#117F60',
    borderLeftColor: '#117F60',
    ':hover': {
      backgroundColor: '#0E6D52',
      borderTopColor: '#0E6D52',
      borderRightColor: '#0E6D52',
      borderBottomColor: '#0E6D52',
      borderLeftColor: '#0E6D52',
    },
    ':active': {
      backgroundColor: '#0B5A44',
      borderTopColor: '#0B5A44',
      borderRightColor: '#0B5A44',
      borderBottomColor: '#0B5A44',
      borderLeftColor: '#0B5A44',
    },
  },
  azioneSecondaria: {
    color: '#117F60',
    borderTopColor: '#E2E9E4',
    borderRightColor: '#E2E9E4',
    borderBottomColor: '#E2E9E4',
    borderLeftColor: '#E2E9E4',
    backgroundColor: '#FFFFFF',
    ':hover': { color: '#0E6D52', backgroundColor: '#F7FAF8' },
  },
  passi: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  passo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '24px',
    border: '1px solid #E5EBE6',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
  },
  numeroPasso: {
    color: '#117F60',
    fontSize: '14px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  titoloPasso: { color: '#173B32', fontSize: '20px', fontWeight: 700 },
  testoPasso: { color: '#65736C', lineHeight: 1.5 },
  richiamo: {
    padding: '20px 24px',
    borderRadius: '10px',
    backgroundColor: '#EAF6F0',
    color: '#238263',
    fontWeight: 600,
  },
  footer: {
    paddingTop: '16px',
    borderTop: '1px solid #E5EBE6',
    color: '#65736C',
    fontSize: '14px',
  },
});

const PASSI = [
  {
    numero: '01 / Entra',
    titolo: 'Verifica la tua e-mail',
    testo: 'Accedi alla comunità della tua organizzazione partner.',
  },
  {
    numero: '02 / Organizza',
    titolo: 'Cerca o offri un passaggio',
    testo: 'Scegli un viaggio verso la tua sede o un evento.',
  },
  {
    numero: '03 / Condividi',
    titolo: 'Viaggia insieme',
    testo: 'Attendi la conferma del conducente e lascia un feedback dopo il viaggio.',
  },
];

export default function PaginaIniziale() {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <section className={styles.pagina}>
      <div className={styles.eroe}>
        <Text className={styles.sopratitolo}>
          Viaggi condivisi · Aziende e università
        </Text>
        <Title1 as="h1" className={styles.titolo}>
          La stessa destinazione.<br />Un viaggio da condividere.
        </Title1>
        <Text className={styles.presentazione}>
          Trova o offri un passaggio verso la tua sede o un evento. Entra nella
          comunità con la tua e-mail aziendale o universitaria.
        </Text>
        <div className={styles.azioni}>
          <Button
            appearance="primary"
            className={styles.azionePrimaria}
            onClick={() => navigate('/registrazione')}
          >
            Unisciti alla comunità
          </Button>
          <Button
            className={styles.azioneSecondaria}
            onClick={() => navigate('/login')}
          >
            Ho già un account
          </Button>
        </div>
      </div>
      <div className={styles.passi}>
        {PASSI.map((passo) => (
          <Card key={passo.numero} className={styles.passo}>
            <Text className={styles.numeroPasso}>{passo.numero}</Text>
            <Text className={styles.titoloPasso}>{passo.titolo}</Text>
            <Text className={styles.testoPasso}>{passo.testo}</Text>
          </Card>
        ))}
      </div>
      <Text className={styles.richiamo}>
        Meno auto, meno spese e una comunità di membri verificati.
      </Text>
      <Text className={styles.footer}>
        CarPool · Mobilità condivisa per aziende e università
      </Text>
    </section>
  );
}
