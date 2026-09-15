/**
 * Formas de datos compartidas por las funciones de lib/auth/acciones.ts.
 * Se mantienen separadas del componente de UI que las llena: cuando entre
 * Supabase Auth, estos son los mismos campos que va a pedir la llamada real.
 */

export interface CredencialesIngreso {
  /** DNI (8 dígitos) o correo electrónico. */
  identificador: string;
  contrasena: string;
}

export interface DatosRegistro {
  nombres: string;
  apellidos: string;
  /** "dni" | "ce" | "pasaporte" — mismos valores que OPCIONES_TIPO_DOCUMENTO. */
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  celular: string;
  contrasena: string;
}

export interface ResultadoAuth {
  /** Ausente = éxito. Con Supabase Auth, mapea desde AuthError.message. */
  error?: string;
}
