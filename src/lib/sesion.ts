// Dónde guarda Supabase la sesión en la web. Con "Mantener sesión iniciada" va a localStorage y dura
// DIAS_RECORDAR días; sin marcarla va a sessionStorage, que el navegador borra al cerrar la pestaña.
// La marca con la fecha de vencimiento vive en localStorage y decide en cuál de los dos se lee.

export const DIAS_RECORDAR = 30;
export const CLAVE_RECORDAR = 'uscupo.recordar-hasta';
const PREFIJO_SUPABASE = 'sb-';
// Verificador PKCE de un enlace por correo (confirmar cuenta, recuperar contraseña): el enlace se
// abre en otra pestaña, así que siempre va a localStorage. Es de un solo uso y Supabase lo borra.
const SUFIJO_VERIFICADOR = '-code-verifier';
const DIA_MS = 86_400_000;

export type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'length'> & { key(indice: number): string | null };

function clavesSupabase(almacen: Almacen): string[] {
  const claves: string[] = [];
  for (let i = 0; i < almacen.length; i++) {
    const clave = almacen.key(i);
    if (clave?.startsWith(PREFIJO_SUPABASE)) claves.push(clave);
  }
  return claves;
}

export function crearAlmacenSesion(local: Almacen, pestana: Almacen, ahora: () => number = Date.now) {
  const hasta = () => Number(local.getItem(CLAVE_RECORDAR)) || 0;

  // Sesiones abiertas antes de la casilla (estaban en localStorage sin marca): se respetan
  // DIAS_RECORDAR días más en vez de cerrarlas de golpe.
  if (!hasta() && clavesSupabase(local).some((clave) => !clave.endsWith(SUFIJO_VERIFICADOR))) {
    local.setItem(CLAVE_RECORDAR, String(ahora() + DIAS_RECORDAR * DIA_MS));
  }

  /** La marca existe pero ya pasó la fecha: se borra la sesión guardada. */
  function vencida(): boolean {
    const h = hasta();
    if (!h || h > ahora()) return false;
    local.removeItem(CLAVE_RECORDAR);
    clavesSupabase(local).forEach((clave) => local.removeItem(clave));
    return true;
  }

  const destino = (clave: string) => {
    vencida();
    return hasta() || clave.endsWith(SUFIJO_VERIFICADOR) ? local : pestana;
  };

  return {
    getItem: (clave: string) => destino(clave).getItem(clave),
    setItem: (clave: string, valor: string) => {
      const d = destino(clave);
      d.setItem(clave, valor);
      (d === local ? pestana : local).removeItem(clave);
    },
    removeItem: (clave: string) => {
      local.removeItem(clave);
      pestana.removeItem(clave);
    },
    /** Se llama justo antes de iniciar sesión, según la casilla. */
    recordar(si: boolean) {
      if (si) local.setItem(CLAVE_RECORDAR, String(ahora() + DIAS_RECORDAR * DIA_MS));
      else local.removeItem(CLAVE_RECORDAR);
    },
    vencida,
  };
}
