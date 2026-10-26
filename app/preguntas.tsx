import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { PREGUNTAS_FRECUENTES } from '../src/models/informacion';

export default function Pagina() {
  return <DocumentoLegal doc={PREGUNTAS_FRECUENTES} ruta="/preguntas" vigencia={false} />;
}
