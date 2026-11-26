import {
  Card,
  MessageBar,
  MessageBarBody,
  Text,
  Title2,
  Title3,
  makeStyles,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  totali: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  totale: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' },
  scheda: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' },
  tabella: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  cella: { padding: '12px', borderBottom: '1px solid #E2E9E4' },
});

export default function ReportRisultati({ report }) {
  const styles = useStyles();
  const metriche = [
    ['Viaggi condivisi', report.totali.viaggiCondivisi],
    ['Posti offerti', report.totali.postiOfferti],
    ['Passeggeri trasportati', report.totali.passeggeriTrasportati],
  ];

  return (
    <>
      {report.avviso && (
        <MessageBar intent="warning"><MessageBarBody>{report.avviso}</MessageBarBody></MessageBar>
      )}
      <section className={styles.totali} aria-label="Totali del report">
        {metriche.map(([etichetta, valore]) => (
          <Card key={etichetta} className={styles.totale}>
            <Title3 as="h2">{etichetta}</Title3>
            <Text>{valore}</Text>
            <Text>Nel periodo selezionato</Text>
          </Card>
        ))}
      </section>
      <Card className={styles.scheda}>
        <Title2 as="h2">Report per mese</Title2>
        <table className={styles.tabella} aria-label="Report mensile">
          <thead>
            <tr>
              {['Mese', 'Viaggi condivisi', 'Posti offerti', 'Passeggeri trasportati'].map((titolo) => (
                <th className={styles.cella} key={titolo} scope="col">{titolo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.mesi.length === 0 ? (
              <tr><td className={styles.cella} colSpan={4}>Nessun dato mensile per il periodo selezionato.</td></tr>
            ) : report.mesi.map((mese) => (
              <tr key={mese.mese}>
                <td className={styles.cella}>{mese.mese}</td>
                <td className={styles.cella}>{mese.viaggiCondivisi}</td>
                <td className={styles.cella}>{mese.postiOfferti}</td>
                <td className={styles.cella}>{mese.passeggeriTrasportati}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
