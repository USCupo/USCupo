import { DocumentoLegal } from '../src/components/DocumentoLegal';
import { metadatos } from '../src/components/MetaPagina';
import { ELIMINAR_CUENTA } from '../src/models/legal';

export const generateMetadata = () => metadatos({ titulo: ELIMINAR_CUENTA.titulo, descripcion: ELIMINAR_CUENTA.resumen, ruta: '/eliminar-cuenta' });

export default function Pagina() {
  return <DocumentoLegal doc={ELIMINAR_CUENTA} ruta="/eliminar-cuenta" />;
}
