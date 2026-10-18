/**
 * Formas de datos compartidas por las funciones de lib/auth/acciones.ts.
 * Correo y contraseña con Supabase Auth: el DNI no sirve para iniciar sesión
 * (D-047), y el registro pide solo lo necesario (Ley 29733).
 */

export interface CredencialesIngreso {
  correo: string;
  contrasena: string;
}

export interface DatosRegistro {
  /** Solo para saludar. No identifica a nadie ni decide nada. */
  nombre: string;
  correo: string;
  contrasena: string;
  /** Ruta a la que volver tras confirmar el correo. */
  siguiente?: string;
}

export interface ResultadoAuth {
  /** Ausente = éxito. Mensaje en español para el usuario. */
  error?: string;
  /** El registro salió bien pero hay que confirmar el correo antes de entrar. */
  requiereConfirmacion?: boolean;
}

export const LARGO_MINIMO_CONTRASENA = 8;
export const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
