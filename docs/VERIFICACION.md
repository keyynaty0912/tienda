# Verificación — 25 de septiembre de 2026

## Completado

- `npm run typecheck`: sin errores TypeScript.
- `npm test`: 14 pruebas unitarias aprobadas. Cálculos enteros, variantes agotadas, cantidades agregadas, disponibilidad tras reservar la última unidad, destinos, cupones, orden de eventos, pago tardío con/sin stock, datos y consentimiento, integridad y firma de eventos.
- `npm run build`: compilación optimizada de Next.js 16.3.6 correcta, incluidos tipos y generación de rutas.
- `node tests/http-checks.mjs`: 13 verificaciones HTTP contra la aplicación local compilada. Cotización de $102.800 COP para vestido de $89.900 y envío demo de $12.900; cobertura y cupón inválidos; cantidad inválida; origen no permitido; administración/cuenta protegidas; pagos y webhook deshabilitados sin configuración; mantenimiento autenticado; sesión anónima; no indexación de demo.
- Auditoría de dependencias npm: cero vulnerabilidades reportadas en el momento de la revisión. Se fijó `uuid@11.1.1` para la dependencia transitiva de `gaxios`; el paquete antiguo reportaba una vulnerabilidad moderada. Esto no equivale a una auditoría completa de seguridad.

## Navegador

Se revisó la versión real de Next.js abierta en el navegador de Codex, distinta del prototipo HTML previo:

- Navegación a producto, rechazo de añadir sin talla, selección de talla y bolsa con variante correcta.
- Bolsa persistida tras recargar la aplicación.
- Checkout invitado con datos ficticios, destino sin cobertura rechazado por la API, cambio a Medellín con tarifa calculada y total correcto.
- Revisión con aceptación contractual y marketing sin marcar; botón de pago deshabilitado.
- Pantalla de checkout a 390 px sin desbordamiento horizontal; catálogo y producto a 320 px sin desbordamiento.
- Barra de compra móvil con precio y acción que enfoca el selector de talla, y reserva de espacio inferior para navegación.
- Búsqueda conservada en la URL al entrar a un producto y volver.

## No verificado aún

- Conexión a Firebase real o emulador, reglas desplegadas, índices, Storage, autenticación/MFA y escritura de administración. No se configuró un proyecto ni se empleó una cuenta de servicio durante esta entrega.
- Concurrencia real de Firestore, autorización de pedidos entre usuarios con sesiones reales, transacciones idempotentes bajo carga y restauración de backups.
- Pagos Wompi sandbox/producción, recepción de webhooks reales, conciliación, anulaciones y reembolsos. Las pruebas de firmas y estados son unitarias; no se presentan como transacciones exitosas.
- Correos transaccionales, transportadora automática y facturación electrónica.
- Auditoría completa WCAG 2.2 AA, pruebas integrales de teclado/lectores de pantalla a 200% y revisión legal.

El diseño está trasladado a la aplicación. La aplicación local funciona en demostración. No se declara tienda lista para vender ni integración de pagos validada.
