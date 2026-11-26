import { Badge, Button, Card, Text, Title3, makeStyles, tokens } from '@fluentui/react-components';
import { useNavigate } from 'react-router';
import { contributoMostrato, dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  scheda: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 17rem), 1fr))',
    gap: 'var(--spazio-3)',
    alignItems: 'center',
    padding: 'var(--spazio-4)',
  },
  percorso: { display: 'grid', gap: 'var(--spazio-1)' },
  dettagli: { display: 'grid', gap: 'var(--spazio-1)', color: tokens.colorNeutralForeground2 },
  posti: { justifySelf: 'start' },
  azione: { justifySelf: 'start' },
});

export default function SchedaViaggio({ viaggio }) {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <Card as="article" className={styles.scheda}>
      <div className={styles.percorso}>
        <Text as="time" dateTime={viaggio.dataOraPartenza}>
          {dataOraMostrata(viaggio.dataOraPartenza)}
        </Text>
        <Title3 as="h3">{viaggio.puntoPartenza} → {viaggio.sede.nome}</Title3>
        <Badge className={styles.posti} appearance="filled" color="success">
          Posti disponibili: {viaggio.postiDisponibili}
        </Badge>
      </div>
      <div className={styles.dettagli}>
        <Text>Con {viaggio.conducente.nome} {viaggio.conducente.cognome}</Text>
        <Text>{contributoMostrato(viaggio.contributoIndicativoEuro)}</Text>
      </div>
      <Button className={styles.azione} onClick={() => navigate(`/viaggi/${viaggio.id}`)}>
        Dettaglio viaggio
      </Button>
    </Card>
  );
}
