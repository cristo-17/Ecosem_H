Tres correcciones en lib/pdf/boleto.ts:

1. SEPARADOR DE RUTA
   Reemplaza la flecha "->" por un guion en todos los lugares del PDF donde
   aparece una ruta o un par de terminales:
   "Lima -> Cerro de Pasco" → "Lima - Cerro de Pasco"
   "Terminal Lima Norte -> Terminal Cerro de Pasco"
   → "Terminal Lima Norte - Terminal Cerro de Pasco"
   Usa guion normal con espacio a cada lado. No toques el "→" de la interfaz
   web (TripCard, Mis viajes, rastreo): ese se queda como está, el cambio es
   solo del PDF.

2. ESPACIADO DEL CÓDIGO DE RESERVA
   En el código grande destacado ("ECH-4B7C12") el dígito que sigue al guion
   se ve pegado. Revisa si se está aplicando letter-spacing manual o kerning
   al dibujar ese texto y ajústalo para que el guion respire igual que el
   resto de caracteres. Si el problema es el kerning de Helvetica en ese par
   de caracteres, aplica un espaciado uniforme al string completo en vez de
   corregir solo ese punto — un ajuste puntual se rompe con otro código de
   reserva distinto.

3. Ruc de la empresa
   RUC: 20573328168.esa es la real

VERIFICACIÓN
Genera de nuevo el PDF de ejemplo de 2 pasajeros y ábrelo para confirmar
visualmente ambos cambios. Confirma también que la descarga desde el botón
real en /mi-perfil produce el mismo resultado.
npx tsc --noEmit && npx eslint . && npm run build pasan.
Registra en docs/BITACORA.md.
