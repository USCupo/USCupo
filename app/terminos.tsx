import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { TERMINOS } from '../src/models/legal';

export default function Pagina() {
  return <DocumentoLegal doc={TERMINOS} ruta="/terminos" />;
}
