# Conexión de Firebase y Wompi

Estado comprobado el 25 de septiembre de 2026.

## Conectado y verificado

- Sitio actualizado: https://tienda-five-lemon.vercel.app
- Vercel: proyecto `tienda`, equipo `store-3e3e`, cuenta propietaria `keyynaty0912-3726`.
- Firebase: `store-33afa`; acceso propietario autorizado con `keyynaty0912@gmail.com`.
- Aplicación web: `1:792915649540:web:5a1e4f043b9a5be15f4151`.
- Firestore: base `(default)`, región `us-east1`, modo nativo, edición Standard, protección frente a eliminación activada.
- Reglas cerradas e índices desplegados. Lectura directa sin autorización rechazada con HTTP 403.
- Cuatro prendas de demostración y configuración guardadas en `demo_*`. Lecturas y escrituras reales comprobadas.
- Dos transacciones simultáneas sobre un documento aislado aceptaron una sola reserva. El documento se eliminó al terminar. No equivale a una prueba integral de compras.
- Variables reales de Firebase y secretos de pedidos/mantenimiento configurados en Production de Vercel. Credenciales excluidas de Git y del despliegue mediante `.vercelignore`.
- Despliegue `dpl_Hwwy5Dxen5P7Zor7FUYMaWbcodAx` completado; parche Firebase aplicado durante la instalación.
- 13 verificaciones HTTP aprobadas sobre el dominio público, incluida la cotización con Firestore y el bloqueo de pagos.

El entorno publicado conserva `CATALOG_MODE=demo`, `CHECKOUT_ENABLED=false` y `LIVE_PAYMENTS_APPROVED=false`. La base es real, pero la tienda aún no está habilitada para vender.

## Pendientes para vender

1. Inicializar Authentication en https://console.firebase.google.com/project/store-33afa/authentication y activar Correo electrónico/contraseña. Su API aún devolvía `404 NOT_FOUND`. Autorizar el dominio de la tienda, configurar Identity Platform/TOTP, registrar y verificar la cuenta administradora y asignarle su rol.
2. Resolver Storage: no existe bucket y el proyecto está en Spark. Las cargas requieren Blaze (pago por uso); el propietario debe decidir y habilitar facturación. No se cambió el plan ni se vinculó una cuenta de facturación.
3. Completar las cuatro llaves Wompi y las pruebas sandbox. Sus variables estaban vacías en Vercel. No se realizaron transacciones ni se habilitaron cobros.
4. Completar vendedor, políticas, cobertura, impuestos, catálogo y stock reales. No convertir el catálogo demostrativo en mercancía real cambiando solo una variable.
5. Conectar correo transaccional y mantenimiento periódico de reservas, conciliación y limpieza. Completar las pruebas integrales y los pendientes de `README.md` y `PAGOS.md`.

## Wompi

Completar en el alojamiento `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET`, primero con llaves sandbox compatibles con `WOMPI_ENV=sandbox`. No enviar claves privadas por chat.

URL de eventos: `https://tienda-five-lemon.vercel.app/api/payments/webhook`.

El servidor genera la redirección hacia `/pago?pedido=...`; el pago se confirma mediante consulta al proveedor, no mediante la URL de retorno.

## Herramientas locales

- `.env.local`: conexión local a Firebase mediante la cuenta de servicio existente.
- `.env.vercel`: copia de las variables aplicadas, contiene secretos y está excluida de Git.
- `.env.vercel.remote`: copia anterior de variables vacías, excluida de Git. No usar para restaurar.
- `scripts/firebase-inspect.cjs`: diagnóstico sin mostrar claves o tokens.
- `scripts/firebase-connect.cjs`: prepara app y variables sin sobrescribir archivos existentes.
- `scripts/firebase-verify.cjs`: comprueba lecturas, transacciones y reglas sin alterar pedidos ni inventario.
- `scripts/vercel-configure.cjs`: aplica variables al proyecto identificado por stdin, sin secretos en argumentos.

Fuentes: [Firebase API](https://firebase.google.com/docs/projects/api/workflow_set-up-and-manage-project), [Storage y facturación](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), [TOTP](https://firebase.google.com/docs/auth/web/totp-mfa), [Wompi Checkout](https://docs.wompi.co/docs/colombia/widget-checkout-web/).
