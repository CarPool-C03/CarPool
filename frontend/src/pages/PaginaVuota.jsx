// Pagina segnaposto per le rotte non ancora implementate: solo il titolo.
import { Title1 } from '@fluentui/react-components';

export default function PaginaVuota({ titolo }) {
  return <Title1 as="h1">{titolo}</Title1>;
}
