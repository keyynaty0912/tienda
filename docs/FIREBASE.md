# Configuración de Firebase

Se validó la credencial del proyecto `store-33afa`, se registró su aplicación web y se creó Firestore en `us-east1`. Las reglas e índices están desplegados y Vercel ya consulta esta base. Authentication y Storage siguen pendientes; consultar [el estado de conexión](CONEXION-PRODUCCION.md). Las consultas y modificaciones de comercio se realizan mediante el Admin SDK en el servidor. Las reglas incluidas deniegan el acceso directo del navegador a Firestore y Storage; las fotos públicas tienen URL de descarga explícita.

1. Crea un proyecto de pruebas en Firebase Console. No actives Google Analytics todavía. Crea Firestore y configura Email/Password en Authentication; añade los dominios autorizados para desarrollo y el dominio final cuando corresponda.
2. Copia `.env.example` a `.env.local`. Completa la configuración web de Firebase en las variables `NEXT_PUBLIC_FIREBASE_*`. Esta configuración no concede privilegios administrativos.
3. Para el servidor, usa Application Default Credentials en un entorno de Google o una cuenta de servicio restringida. Guarda su archivo fuera del repositorio y configura `GOOGLE_APPLICATION_CREDENTIALS`. Alternativamente configura `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` y el bucket. Nunca uses `NEXT_PUBLIC_` para secretos.
4. Selecciona `CATALOG_MODE=demo`. Aplica `firestore.rules`, `firestore.indexes.json` y `storage.rules` usando el proyecto correcto. Las reglas cerradas son intencionales: la API de Next.js verifica permisos antes de usar Admin SDK.
5. Ejecuta `npm run seed:demo`. Solo crea colecciones `demo_*`; se niega a sobrescribir catálogo o configuración existentes. El esquema inicial queda registrado en `demo_schema/version`. Firestore no exige migraciones SQL; los esquemas Zod y este registro controlan la versión inicial. Cualquier evolución requerirá un script versionado antes de actualizar documentos antiguos.
6. Registra una cuenta, verifica su correo y ejecuta `npm run admin:grant -- UID admin`. La asignación de roles no está expuesta por HTTP. Los cambios revocan sesiones y requieren volver a entrar. Roles: `admin`, `catalog`, `fulfillment`, `support`, `customer`.
7. Para administración de producción, habilita Firebase Authentication con Identity Platform y TOTP MFA. El servidor exige correo verificado, rol y segundo factor en producción. El cliente permite resolver el desafío TOTP y configurar el autenticador desde Cuenta; debe iniciarse sesión recientemente.
8. Completa datos del vendedor, catálogo real, medidas, políticas, impuestos, cobertura y tarifas. Producción utiliza colecciones sin `demo_`; no se copian productos demostrativos automáticamente.

## Emuladores

`firebase.json` define Auth 9099, Firestore 8080 y Storage 9199. Requieren Firebase CLI y Java compatible para Firestore. Arranca con `firebase emulators:start --project demo-key-naty`. Usa las variables de emuladores comentadas en `.env.example`; no las configures en un despliegue real. Los tests unitarios no sustituyen una prueba de concurrencia del SDK contra un emulador o proyecto de pruebas.

## Copias y recuperación

Antes de vender, habilita copias programadas de Firestore y acuerda retención y objetivos de recuperación. La programación no se creó porque no existe un proyecto. Documenta el bucket privado de respaldo, permisos y ubicación. Antes de importar o cambiar el esquema, exporta Firestore con las herramientas oficiales del proyecto y conserva una copia/versionado de las imágenes. Ensaya una restauración en un proyecto aislado; compara productos, stock, reservas, pedidos, pagos, políticas y auditoría antes de reabrir ventas. Evita restaurar una base antigua sobre un comercio que siga recibiendo pagos; concilia el intervalo con Wompi.

Configura limpieza/TTL de límites de solicitudes con una política apropiada; por ahora `rateLimits.expiresAt` es numérico y no debe configurarse como TTL directamente. Añadir una tarea de limpieza o migrarlo a Timestamp es un pendiente operativo. Los registros de autorización y pedidos requieren su propia política de retención, no la limpieza de rate limits.

## Fuentes oficiales consultadas

- Admin SDK: https://firebase.google.com/docs/admin/setup
- Cookies de sesión: https://firebase.google.com/docs/auth/admin/manage-cookies
- Transacciones: https://firebase.google.com/docs/firestore/manage-data/transactions
- MFA TOTP: https://firebase.google.com/docs/auth/web/totp-mfa

La autenticación de la cuenta de servicio y el acceso a Firebase Management API se verificaron. También pasaron lecturas y escrituras de Firestore, una prueba de dos reservas concurrentes sobre un documento aislado y el rechazo de lecturas directas sin autorización. El documento temporal de comprobación se eliminó al terminar. Esto aún no sustituye las pruebas integrales de pedidos y pagos.
