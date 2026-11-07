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
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // next/image genera estos dos atributos: color transparente y geometría
    // de fill. Un nonce no autoriza atributos; limitar a sus hashes exactos.
    "style-src-attr 'unsafe-hashes' 'sha256-zlqnbDt84zf1iSefLU/ImC54isoprH/MRiVZGskwexk=' 'sha256-ZDrxqUOB4m/L0JWL/+gS52g1CRH0l/qwMhjTw5Z/Fsc='",
    `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace(/^http/, "ws")}`,
    `img-src 'self' data: blob: ${supabaseOrigin}`,
    "font-src 'self'", "object-src 'none'", "base-uri 'self'",
    "form-action 'self'", "frame-ancestors 'none'", "frame-src 'none'",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  // Sobrescribir siempre: un cliente no puede elegir el nonce ni la política.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const continuar = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  let respuesta = continuar();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(porEscribir, cabeceras) {
          for (const { name, value } of porEscribir) request.cookies.set(name, value);
          requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
          respuesta = continuar();
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
    redireccion.headers.set("Content-Security-Policy", csp);
    redireccion.headers.set("Cache-Control", "private, no-store");
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
