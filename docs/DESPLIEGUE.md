# Despliegue

## Ambientes

```
desarrollo  →  preview por rama  →  producción
```

Ningún cambio llega a producción sin haber pasado por preview. Sin excepción.

## Estado actual

Nada desplegado. Cloudflare Pages y Supabase aún no configurados.

## Checklist de configuración inicial (pendiente)

- [ ] Repositorio en GitHub con las tres ramas/ambientes
- [ ] Proyecto en Cloudflare Pages conectado al repositorio
- [ ] Preview automático por rama
- [ ] Proyecto Supabase (desarrollo y producción separados)
- [ ] Migraciones versionadas en el repositorio
- [ ] Variables de entorno por ambiente, nunca en el repositorio
- [ ] Sentry para monitoreo de errores
- [ ] UptimeRobot apuntando a producción
- [ ] Dominio propio con TLS (incluye migrar el módulo de facturación fuera de IP cruda)

## Reglas

- Migraciones de base de datos versionadas. Ningún cambio de esquema aplicado a mano.
- Contra producción, el MCP de Supabase se usa en **modo lectura**.
- Los despliegues no deben interrumpir compras en curso: despliegue progresivo.
- Secretos (claves de pasarela, HMAC del QR, tokens de WhatsApp) nunca en el
  repositorio ni en el cliente.

## Fase 0 — cumplimiento legal (antes de cualquier feature)

Prioridad sobre el resto del plan, según la propuesta técnica:

1. Libro de Reclamaciones virtual operativo.
2. Módulo de facturación migrado a subdominio propio con TLS (hoy se sirve desde
   IP cruda en puerto 8080, sin certificado).
3. Corrección de erratas y datos societarios inconsistentes.
4. Iniciar el trámite de homologación con el proveedor OSE/PSE.

## Riesgo de tráfico

Picos en feriados largos y Fiestas Patrias. El frontend se sirve desde CDN con
escalado automático; el punto de presión es la base de datos en el momento de
reserva.
