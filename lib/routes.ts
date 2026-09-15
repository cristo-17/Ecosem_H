/**
 * Rutas reales del sitio. Ningún enlace de navegación/footer debe apuntar a
 * "#": las entradas de Mis Viajes, Ayuda, etc. todavía no tienen pantalla
 * propia, pero la ruta ya es la definitiva (se implementará ahí).
 */
export const RUTAS = {
  inicio: "/",
  nosotros: "/nosotros",
  misViajes: "/mis-viajes",
  miPerfil: "/mi-perfil",
  ingresar: "/ingresar",
  registro: "/registro",
  recuperarClave: "/recuperar-clave",
  enviarEncomienda: "/encomiendas/enviar",
  rastrearEncomienda: "/encomiendas/rastrear",
  ayuda: "/ayuda",
  libroReclamaciones: "/libro-de-reclamaciones",
  resultadosPasajes: "/pasajes/resultados",
  compraAsientos: "/pasajes/comprar/asientos",
  compraDatos: "/pasajes/comprar/datos",
  compraPago: "/pasajes/comprar/pago",
  compraConfirmacion: "/pasajes/comprar/confirmacion",
  panel: "/panel",
  panelViajes: "/panel/viajes",
  panelVenta: "/panel/venta",
  panelCaja: "/panel/caja",
  panelPrecios: "/panel/precios",
  embarque: "/embarque",
} as const;

/** Detalle de un viaje del día en el panel — ruta dinámica, no una entrada fija de RUTAS. */
export function rutaPanelViaje(id: string): string {
  return `${RUTAS.panelViajes}/${id}`;
}

/** Pantalla de escaneo de un viaje en la PWA de embarque — ruta dinámica. */
export function rutaEmbarqueViaje(id: string): string {
  return `${RUTAS.embarque}/${id}`;
}
