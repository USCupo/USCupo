import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { ELIMINAR_CUENTA } from '../src/models/legal';

export default function Pagina() {
  return <DocumentoLegal doc={ELIMINAR_CUENTA} ruta="/eliminar-cuenta" />;
}
