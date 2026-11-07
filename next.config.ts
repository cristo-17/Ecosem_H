import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (fase: string): NextConfig => ({
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
      // Los documentos reciben la política con nonce en proxy.ts. Los recursos
      // que no pasan por el proxy conservan esta política restrictiva.
      { key: "Content-Security-Policy", value: "default-src 'none'; base-uri 'none'; frame-ancestors 'none'" },
    ] }];
  },
  devIndicators: false,
  images: {
    // Workers no ejecuta /_next/image. Servir originales en ambos ambientes;
    // se conservan dimensiones y lazy loading, sin conversión ni redimensionado.
    unoptimized: true,
    // Next 16 exige declarar explícitamente cada quality usada: por defecto
    // solo permite 75. 90 es solo para el carrusel y el encabezado de
    // /nosotros (ver docs/prompts/05-nitidez-imagenes-nosotros.md) — el
    // resto del sitio sigue en 75 para no subir peso de página.
    qualities: [75, 90],
  },
  turbopack: {
    // La barra de cuentas de prueba existe SOLO en desarrollo. En la
    // compilación de producción su import resuelve a un sustituto vacío: ni
    // el componente, ni su Server Action, ni el código que lee las cuentas
    // de prueba entran al build. No depende de que el `if` de app/layout.tsx
    // se elimine bien (D-049; verificado con grep sobre `.next/`).
    resolveAlias:
      fase === PHASE_PRODUCTION_BUILD
        ? {
            "@/components/layout/SelectorRolDemo":
              "@/components/layout/SelectorRolDemo.produccion",
          }
        : {},
  },
});

export default nextConfig;
