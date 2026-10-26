import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { CONTACTO } from '../src/models/informacion';

export default function Pagina() {
  return <DocumentoLegal doc={CONTACTO} ruta="/contacto" vigencia={false} />;
}
