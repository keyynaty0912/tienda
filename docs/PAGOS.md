# Wompi Colombia — preparado, no activado

Se implementó un adaptador `PaymentProvider` con checkout alojado oficial, firma de integridad y consulta autenticada desde servidor. No se manejan números de tarjeta ni CVV. El checkout oficial determina los métodos habilitados para la cuenta del comercio; la tienda no anuncia métodos concretos sin esa configuración.

Fuentes oficiales revisadas el 25 de septiembre de 2026:

- https://docs.wompi.co/docs/colombia/widget-checkout-web/
- https://docs.wompi.co/docs/colombia/eventos/
- https://docs.wompi.co/docs/colombia/transacciones/
- https://docs.wompi.co/docs/colombia/ambientes-y-llaves/

## Activación de pruebas

1. Crear y configurar primero el proyecto Firebase de pruebas y cargar el catálogo demo.
2. Configurar `WOMPI_ENV=sandbox`, llave pública `pub_test_*`, privada `prv_test_*`, secreto de integridad `test_integrity_*` y eventos `test_events_*`. Son secretos diferentes. Las claves privadas nunca llegan al navegador.
3. Generar `ORDER_TOKEN_SECRET` y `CRON_SECRET` aleatorios, de al menos 32 caracteres, distintos por ambiente. Configurar el origen exacto en `NEXT_PUBLIC_SITE_URL`.
4. Configurar en Wompi una URL HTTPS de pruebas para `/api/payments/webhook`. Usar un endpoint y proyecto distintos para producción.
5. Habilitar `CHECKOUT_ENABLED=true` solo para pruebas. No se ha hecho en esta entrega.
6. Programar POST autenticado a `/api/maintenance` con `Authorization: Bearer CRON_SECRET` para conciliación y liberación de reservas. No hay una tarea externa creada. Se procesa un máximo de 100 pendientes y 100 vencidas por ejecución; debe ampliarse con paginación y monitorización antes de operar a mayor escala.

## Garantías de la implementación y límites

- Precio, descuento y tarifa recalculados desde Firestore. COP enteros convertidos a centavos para Wompi. El cliente solo propone cantidades, variantes y el total que vio.
- Firestore reserva stock y uso de cupón en la misma transacción que crea el pedido. Una clave de idempotencia vinculada a la sesión de invitado devuelve el mismo pedido ante repetición; un cuerpo diferente con esa clave se rechaza.
- El identificador de intento forma parte de la referencia. Esta versión conserva un intento por pedido y bloquea reutilizar un pedido terminado. No habilita un segundo intento incierto. El flujo ampliado de reintentos con nueva referencia después de conciliar está pendiente.
- La firma de evento usa sus propiedades dinámicas y comparación constante. Se consulta además la transacción al proveedor con llave privada para verificar referencia, moneda e importe, incluidos campos que podrían no estar cubiertos por la firma recibida.
- Los eventos se deduplican en Firestore. Una aprobación no se revierte a pendiente por eventos atrasados. Si un pago llega tras liberar la reserva, solo se consume stock libre; si falta stock, queda pagado en revisión manual y no se prepara automáticamente.
- La URL de retorno no marca pagos como aprobados. La consulta segura del pedido puede pedir conciliación de un ID de transacción; se verifica en servidor que pertenezca a su referencia.
- El reembolso en administración registra un comprobante de una operación realizada externamente y queda vinculado a la transacción original. No ejecuta un reembolso en Wompi. La integración de reembolsos debe completarse y verificarse con los métodos realmente habilitados.
- Los eventos de anulación posteriores a una aprobación requieren el proceso de reembolsos/conciliación ampliado. No se muta una venta pagada automáticamente por un evento atrasado.

Producción permanece bloqueada salvo que coincidan `WOMPI_ENV=production`, `CATALOG_MODE=production`, `LIVE_PAYMENTS_APPROVED=true`, claves de producción y datos/controles operativos del negocio. Además exige una autorización humana de lanzamiento y pruebas críticas; las variables no acreditan que esas pruebas se hayan realizado.

No se hicieron transacciones contra Wompi. Ningún resultado de pago de la entrega debe interpretarse como validación del proveedor.
