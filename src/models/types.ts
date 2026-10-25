export type CarreraTipo = 'pregrado' | 'tecnico' | 'posgrado';
export type OfertaEstado = 'disponible' | 'en_proceso' | 'resuelta' | 'expirada';

export interface Carrera {
  id: number;
  nombre: string;
  tipo: CarreraTipo;
  facultad: string;
  sede: string;
  activa: boolean;
}

export interface Materia {
  id: number;
  carrera_id: number;
  nombre: string;
  codigo: string;
  semestre: number | null;
}

export interface BloqueHorario {
  id: number;
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
  etiqueta: string;
}

export interface Profile {
  id: string;
  nombre_completo: string;
  correo: string;
  carrera_id: number | null;
  whatsapp: string | null;
  mostrar_correo: boolean;
  mostrar_whatsapp: boolean;
  created_at: string;
  /** Versión de términos y política aceptada (Ley 1581); null = nunca aceptó. */
  legal_version: string | null;
  /** 'admin' = cuenta de revisión; 'demo' = sus contrapartes. Ausente antes de la migración 000005. */
  rol?: 'estudiante' | 'admin' | 'demo';
}

export interface PerfilPublico {
  id: string;
  nombre_completo: string;
  carrera_id: number | null;
}

export interface Oferta {
  id: number;
  user_id: string;
  materia_id: number;
  grupo: string;
  bloque_actual_id: number;
  comentario: string | null;
  estado: OfertaEstado;
  interesado_id: string | null;
  interesado_at: string | null;
  resuelta_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface ContactoRevelado {
  perfil_id: string;
  nombre_completo: string;
  correo: string | null;
  whatsapp: string | null;
}
