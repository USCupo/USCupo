import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { metadatos } from '../src/components/MetaPagina';
import { CONTACTO } from '../src/models/informacion';

export const generateMetadata = () => metadatos({ titulo: CONTACTO.titulo, descripcion: CONTACTO.resumen, ruta: '/contacto' });

export default function Pagina() {
  return <DocumentoLegal doc={CONTACTO} ruta="/contacto" vigencia={false} />;
}
