# Key & Naty — Next.js + Firebase

Implementación local iniciada y preparada para configuración. **No está lista para producción**: Firebase y Wompi no están conectados ni verificados, y no se publicaron recursos externos.

## Abrir

Requiere Node.js 22 o posterior. Desde esta carpeta:

```powershell
npm install
npm run dev
```

Abrir http://localhost:3000, el origen configurado por defecto para validar las solicitudes. Los scripts invocan los ejecutables con Node para soportar el `&` en la ruta de este workspace en Windows.

El comando `npm install` aplica un parche local a `jwks-rsa@4.1.0`: esa dependencia carga `jose@6` con `require()` y falla en algunos entornos CommonJS de producción al importar Firebase Admin Auth. El parche usa `import()` en las dos rutas afectadas y exige revisar el cambio si se actualiza `jwks-rsa`. Está en `scripts/patch-jwks.cjs` y se ejecuta con `postinstall`; el despliegue debe instalar dependencias con scripts habilitados. Retirar el parche cuando el proveedor publique la corrección.

```powershell
npm run typecheck
npm test
npm run build
npm start
```

Sin variables Firebase, `CATALOG_MODE=demo` carga cuatro prendas locales identificadas como demostración. El catálogo es navegable; bolsa y favoritos persisten en el navegador. Los datos personales del checkout solo permanecen en memoria hasta crear una orden de servidor. Sin configurar los servicios, los pedidos y pagos están bloqueados, no simulados como exitosos.

## Implementado

- App Router con inicio, catálogo, categorías, búsqueda, producto, favoritos, bolsa, checkout, resultado de pago, consulta de pedido, cuenta opcional, tallas, nosotros, ayuda y políticas.
- Identidad visual adaptada de la propuesta, fotos WebP, fuentes locales OFL, móvil y escritorio, controles semánticos, foco y estados de vacío/error/carga/agotado.
- Búsqueda por nombre/categoría/referencia; filtros por categoría, talla disponible, color, edad, ocasión y precio. URL conserva filtros. Orden por fecha/precio. Selector de variante obligatorio.
- Capa Firestore con esquemas Zod, aislamiento `demo_*`, transacciones de inventario/cupones/pedidos y scripts iniciales.
- Firebase Auth, sesiones HttpOnly, roles y exigencia de MFA para administración de producción. Reglas cerradas de Firestore/Storage y APIs con validación y control de origen.
- Administración de productos, variantes/SKU, stock, imágenes optimizadas y texto alternativo, medidas, destacados, datos del negocio, contenido de inicio, cobertura, cupones, pedidos/guías manuales, versiones de políticas, solicitudes posventa y auditoría.
- Importación/exportación JSON de hasta 100 productos por archivo. Validación completa de formato antes de importar; escrituras independientes por producto. Una falla operativa puede dejar importación parcial: revisar el listado y volver a importar los pendientes.
- Checkout invitado con cotización del servidor, consentimiento contractual separado de marketing, clave de idempotencia, reservas y adaptador Wompi alojado.
- SEO básico con metadata, canónicos, robots/sitemap y datos estructurados solo de productos reales; demostración y áreas privadas no indexables.

## Configurar

- [Firebase, acceso y respaldo](docs/FIREBASE.md)
- [Wompi, eventos y reservas](docs/PAGOS.md)
- `.env.example`: configuración sin credenciales.
- `firestore.rules`, `storage.rules`, `firestore.indexes.json`: recursos por aplicar al proyecto elegido.
- `src/lib/schema.ts`: versión inicial de los documentos de negocio.

## Pendiente antes de vender

1. Crear Firebase y verificar reglas, índices, roles, MFA, Storage y lecturas/escrituras reales. Probar simultaneidad sobre la última unidad en Firestore.
2. Completar y revisar datos legales, políticas, catálogo y medidas reales, impuestos, cobertura y atención. Los borradores enlazan fuentes oficiales, no garantizan cumplimiento automático.
3. Configurar Wompi sandbox y ejecutar compras, eventos inválidos/duplicados/fuera de orden, rechazos, interrupción, conciliación y pago tardío. Implementar el flujo ampliado de reintentos y conciliación de anulaciones/reembolsos antes de producción.
4. Conectar correo transaccional. Hoy solo se registran eventos en `mailQueue`; no hay envío de confirmaciones ni notificaciones. Seleccionar transportadora/agregador si se desea automatizar lo que hoy se registra manualmente. Conectar facturación si aplica; los resúmenes no son facturas DIAN.
5. Completar gestión avanzada de colecciones/categorías personalizables, promociones con programación y evidencias adjuntas de posventa. Las categorías iniciales son las cuatro definidas para la boutique. No hay estadísticas ficticias.
6. Configurar mantenimiento periódico, limpieza de límites, monitorización, copia/restauración y pruebas contra abuso. La limitación distribuida usa Firestore; sin un proxy verificado se comparte un límite global por operación para no confiar en IP manipulable.
7. Auditoría completa de accesibilidad WCAG 2.2 AA y seguridad, revisión de rendimiento con catálogo real y autorizaciones de publicación/dominio/cobros. No hay publicidad ni analítica no esencial activas.

## Estado de las pruebas

Las pruebas unitarias cubren cálculo de importes, stock/cupones, destinos, orden de estados, pagos tardíos, formato de checkout y firmas Wompi. La prueba de “última unidad” valida la regla de disponibilidad; **no equivale** a una prueba concurrente de Firestore. La verificación de navegador y las limitaciones se registran en `docs/VERIFICACION.md`.

Fuentes: Next.js https://nextjs.org/docs/app/getting-started/installation; Firebase y Wompi en los documentos correspondientes. Fotografías creadas con Imagegen; prompts en `docs/image-prompts.json`. Archivos finales en `public/assets/`; tipografías y licencias en `public/assets/fonts/`.
