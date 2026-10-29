import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { metadatos } from '../src/components/MetaPagina';
import { PRIVACIDAD } from '../src/models/legal';

export const generateMetadata = () => metadatos({ titulo: PRIVACIDAD.titulo, descripcion: PRIVACIDAD.resumen, ruta: '/privacidad' });

export default function Pagina() {
  return <DocumentoLegal doc={PRIVACIDAD} ruta="/privacidad" />;
}
