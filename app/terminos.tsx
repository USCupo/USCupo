import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { metadatos } from '../src/components/MetaPagina';
import { TERMINOS } from '../src/models/legal';

export const generateMetadata = () => metadatos({ titulo: TERMINOS.titulo, descripcion: TERMINOS.resumen, ruta: '/terminos' });

export default function Pagina() {
  return <DocumentoLegal doc={TERMINOS} ruta="/terminos" />;
}
