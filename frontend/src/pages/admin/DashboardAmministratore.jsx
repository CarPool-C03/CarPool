import { Card, Title1, makeStyles } from '@fluentui/react-components';
import { Link } from 'react-router';

const useStyles = makeStyles({
  riquadri: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' },
});

export default function DashboardAmministratore() {
  const styles = useStyles();
  return (
    <section>
      <Title1 as="h1">Dashboard</Title1>
      <div className={styles.riquadri}>
        <Card>
          <h2>Gestione partner</h2>
          <Link to="/admin/organizzazioni">Gestisci organizzazioni</Link>
        </Card>
        <Card>
          <h2>Mobility Manager</h2>
          <Link to="/admin/membri">Gestisci membri e ruoli</Link>
        </Card>
      </div>
    </section>
  );
}
