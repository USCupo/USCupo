import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { ACERCA } from '../src/models/informacion';

export default function Pagina() {
  return <DocumentoLegal doc={ACERCA} ruta="/acerca" vigencia={false} />;
}
