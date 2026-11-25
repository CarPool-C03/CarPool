import { Badge, Button, Card, Text, makeStyles } from '@fluentui/react-components';
import { useNavigate } from 'react-router';
import { contributoMostrato, dataOraMostrata } from './ricercaUtilita.js';

const useStyles = makeStyles({
  scheda: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' },
});

export default function SchedaViaggio({ viaggio }) {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <Card className={styles.scheda}>
      <Badge appearance="filled" color="success">
        Posti disponibili: {viaggio.postiDisponibili}
      </Badge>
      <Text>{dataOraMostrata(viaggio.dataOraPartenza)}</Text>
      <Text>{viaggio.puntoPartenza} → {viaggio.sede.nome}</Text>
      <Text>
        Con {viaggio.conducente.nome} {viaggio.conducente.cognome}
      </Text>
      <Text>{contributoMostrato(viaggio.contributoIndicativoEuro)}</Text>
      <Button
        appearance="primary"
        onClick={() => navigate(`/viaggi/${viaggio.id}`)}
      >
        Dettaglio viaggio
      </Button>
    </Card>
  );
}
