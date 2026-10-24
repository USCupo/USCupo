// Núcleo de useCargaEnFoco sin React (CargaEnFoco.kt de Android), para poder probarlo solo.
// La primera carga muestra "cargando"; las siguientes refrescan en silencio. Si dos cargas se
// cruzan, gana la más reciente.

/** Un foco no vuelve a pedir si la última carga buena tiene menos de esto. */
export const VIGENCIA_MS = 15_000;

export interface EstadoCarga<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
}

interface Opciones<T> {
  cargar: () => Promise<T>;
  alCambiar: (estado: EstadoCarga<T>) => void;
  mensajeDeError: (e: unknown) => string;
  ahora?: () => number;
  vigenciaMs?: number;
}

export class Cargador<T> {
  estado: EstadoCarga<T> = { datos: null, cargando: true, error: null };
  /** Carga en curso (null si no hay ninguna). */
  enCurso: Promise<void> | null = null;
  private turno = 0;
  private cargadoEn: number | null = null;
  private o: Opciones<T>;

  constructor(opciones: Opciones<T>) {
    this.o = opciones;
  }

  /** Foco automático: recarga solo si no hay una en curso ni datos vigentes. */
  alFoco(): Promise<void> | null {
    if (this.enCurso) return null;
    const ahora = this.o.ahora ?? Date.now;
    const ultima = this.cargadoEn;
    if (ultima !== null && this.estado.error === null && ahora() - ultima < (this.o.vigenciaMs ?? VIGENCIA_MS)) return null;
    return this.recargar();
  }

  /** Acciones y recarga manual: siempre piden. */
  recargar(): Promise<void> {
    const mio = ++this.turno;
    const p = this.ejecutar(mio);
    this.enCurso = p;
    return p;
  }

  /** Cambiaron las dependencias (usuario, carrera): los datos guardados ya no valen. */
  invalidar() {
    this.cargadoEn = null;
  }

  private async ejecutar(mio: number) {
    try {
      const datos = await this.o.cargar();
      if (mio !== this.turno) return;
      this.cargadoEn = (this.o.ahora ?? Date.now)();
      this.publicar({ datos, cargando: false, error: null });
    } catch (e) {
      if (mio !== this.turno) return;
      this.publicar({ ...this.estado, cargando: false, error: this.o.mensajeDeError(e) });
    } finally {
      if (mio === this.turno) this.enCurso = null;
    }
  }

  private publicar(e: EstadoCarga<T>) {
    this.estado = e;
    this.o.alCambiar(e);
  }
}
