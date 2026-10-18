import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (fase: string): NextConfig => ({
  devIndicators: false,
  images: {
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
