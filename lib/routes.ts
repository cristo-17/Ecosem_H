/**
 * Rutas reales del sitio. Ningún enlace de navegación/footer debe apuntar a
 * "#": las entradas de Mis Viajes, Ayuda, etc. todavía no tienen pantalla
 * propia, pero la ruta ya es la definitiva (se implementará ahí).
 */
export const RUTAS = {
  inicio: "/",
  misViajes: "/mis-viajes",
  enviarEncomienda: "/encomiendas/enviar",
  rastrearEncomienda: "/encomiendas/rastrear",
  ayuda: "/ayuda",
  libroReclamaciones: "/libro-de-reclamaciones",
  resultadosPasajes: "/pasajes/resultados",
  compraAsientos: "/pasajes/comprar/asientos",
  compraDatos: "/pasajes/comprar/datos",
  compraPago: "/pasajes/comprar/pago",
  compraConfirmacion: "/pasajes/comprar/confirmacion",
} as const;
