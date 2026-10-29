import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { metadatos } from '../src/components/MetaPagina';
import { PREGUNTAS_FRECUENTES } from '../src/models/informacion';

export const generateMetadata = () => metadatos({ titulo: PREGUNTAS_FRECUENTES.titulo, descripcion: PREGUNTAS_FRECUENTES.resumen, ruta: '/preguntas' });

export default function Pagina() {
  return <DocumentoLegal doc={PREGUNTAS_FRECUENTES} ruta="/preguntas" vigencia={false} />;
}
