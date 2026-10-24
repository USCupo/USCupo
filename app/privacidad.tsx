import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { PRIVACIDAD } from '../src/models/legal';

export default function Pagina() {
  return <DocumentoLegal doc={PRIVACIDAD} />;
}
