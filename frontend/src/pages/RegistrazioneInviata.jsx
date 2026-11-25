import { Card, Text, Title1, Title2 } from '@fluentui/react-components';
import { Link } from 'react-router';

export default function RegistrazioneInviata() {
  return (
    <Card>
      <Title1 as="h1">Controlla la tua e-mail</Title1>
      <Title2 as="h2">Ti abbiamo inviato un link di verifica</Title2>
      <Text>Apri il link ricevuto per attivare il tuo account CarPool.</Text>
      <Link to="/login">Accedi</Link>
    </Card>
  );
}
