import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Secciones que exigen sesión. El rol (personal, supervisor) no se decide
// aquí: lo comprueba cada layout en el servidor (lib/auth/sesion.ts).
const PREFIJOS_CON_SESION = ["/panel", "/embarque", "/mi-perfil"];

/**
 * Corre antes de cada página:
 * 1. Renueva la sesión de Supabase Auth si el token de acceso venció, y
 *    escribe las cookies nuevas en la respuesta. Así una recarga con la
 *    sesión viva no muestra al usuario como si no hubiera entrado.
 * 2. Filtro optimista: sin sesión, una ruta protegida va al ingreso y vuelve
 *    aquí al entrar. Es un atajo, no la barrera: los layouts vuelven a
 *    verificar y los servicios verifican el token por su cuenta.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(porEscribir, cabeceras) {
          for (const { name, value } of porEscribir) request.cookies.set(name, value);
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of porEscribir) {
            respuesta.cookies.set(name, value, options);
          }
          // Una respuesta que renueva la sesión no se guarda en ninguna caché.
          for (const [clave, valor] of Object.entries(cabeceras ?? {})) {
            respuesta.headers.set(clave, valor);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub) && data?.claims?.is_anonymous !== true;

  const { pathname, search } = request.nextUrl;
  const protegida = PREFIJOS_CON_SESION.some(
    (prefijo) => pathname === prefijo || pathname.startsWith(`${prefijo}/`),
  );
  if (protegida && !conSesion) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/ingresar";
    destino.search = new URLSearchParams({ siguiente: `${pathname}${search}` }).toString();
    const redireccion = NextResponse.redirect(destino);
    for (const cookie of respuesta.cookies.getAll()) redireccion.cookies.set(cookie);
    return redireccion;
  }

  return respuesta;
}

export const config = {
  // Todo menos estáticos e imágenes, para que la sesión se renueve en
  // cualquier navegación (y en las Server Actions de cada ruta).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
