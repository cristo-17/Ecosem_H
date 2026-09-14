import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // Next 16 exige declarar explícitamente cada quality usada: por defecto
    // solo permite 75. 90 es solo para el carrusel y el encabezado de
    // /nosotros (ver docs/prompts/05-nitidez-imagenes-nosotros.md) — el
    // resto del sitio sigue en 75 para no subir peso de página.
    qualities: [75, 90],
  },
};

export default nextConfig;
