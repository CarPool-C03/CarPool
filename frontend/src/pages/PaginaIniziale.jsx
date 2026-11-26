// Pagina iniziale pubblica: presentazione e accesso alla comunità.
import { Button, Card, Text, Title1 } from '@fluentui/react-components';
import { useNavigate } from 'react-router';

import './paginaIniziale.css';

const PASSI = [
  {
    titolo: 'Verifica la tua e-mail',
    testo: 'Accedi alla comunità della tua organizzazione partner.',
  },
  {
    titolo: 'Cerca o offri un passaggio',
    testo: 'Scegli un viaggio verso la tua sede o un evento.',
  },
  {
    titolo: 'Viaggia insieme',
    testo: 'Attendi la conferma del conducente e lascia un feedback dopo il viaggio.',
  },
];

export default function PaginaIniziale() {
  const navigate = useNavigate();

  return (
    <section className="iniziale-pagina">
      <div className="iniziale-eroe">
        <div className="iniziale-intro">
          <Text className="iniziale-sopratitolo">
            Viaggi condivisi · Aziende e università
          </Text>
          <Title1 as="h1" className="iniziale-titolo">
            La stessa destinazione.<br />Un viaggio da condividere.
          </Title1>
          <Text className="iniziale-presentazione">
            Trova o offri un passaggio verso la tua sede o un evento. Entra nella
            comunità con la tua e-mail aziendale o universitaria.
          </Text>
          <div className="iniziale-azioni">
            <Button
              appearance="primary"
              size="large"
              onClick={() => navigate('/registrazione')}
            >
              Unisciti alla comunità
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/login')}
            >
              Ho già un account
            </Button>
          </div>
        </div>
        <div className="iniziale-itinerario">
          <span>Partenza</span>
          <span>La tua sede o il tuo evento</span>
        </div>
      </div>
      <div className="iniziale-passi">
        {PASSI.map((passo) => (
          <Card key={passo.titolo} className="iniziale-passo">
            <Text as="h2" className="iniziale-titoloPasso">{passo.titolo}</Text>
            <Text className="iniziale-testoPasso">{passo.testo}</Text>
          </Card>
        ))}
      </div>
      <Text className="iniziale-richiamo">
        Meno auto, meno spese e una comunità di membri verificati.
      </Text>
      <Text className="iniziale-footer">
        CarPool · Mobilità condivisa per aziende e università
      </Text>
    </section>
  );
}
