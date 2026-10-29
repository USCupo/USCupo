import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { metadatos } from '../src/components/MetaPagina';
import { ACERCA } from '../src/models/informacion';

export const generateMetadata = () => metadatos({ titulo: ACERCA.titulo, descripcion: ACERCA.resumen, ruta: '/acerca' });

export default function Pagina() {
  return <DocumentoLegal doc={ACERCA} ruta="/acerca" vigencia={false} />;
}
