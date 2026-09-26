# Verificación de correo de Key & Naty

Estado comprobado el 26 de septiembre de 2026:

- Firebase Authentication usa `es` como idioma predeterminado. La plantilla integrada de verificación presenta asunto y cuerpo en español. La aplicación también fija `auth.languageCode = "es"` antes de solicitar el envío.
- `tienda-five-lemon.vercel.app` está autorizado en Firebase. Los correos de verificación solicitados desde la tienda incluyen la ruta `/cuenta` como URL de continuación. Se comprobó la generación de un enlace de acción que regresa a ese dominio sin exponer el código.
- El remitente y la página de confirmación siguen usando los dominios predeterminados de Firebase. El proyecto rechazó dos intentos de editar la plantilla integrada, incluso solo el asunto y el nombre del remitente, con `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`. Su contenido no puede considerarse personalizado.
- [firebase-verification-email.html](./firebase-verification-email.html) es la plantilla visual propuesta para un servicio de correo propio. **No está conectada al envío activo.**

Para activarla después se necesita un dominio que controle la tienda y un servicio de envío configurado con sus registros DNS. La aplicación deberá generar el enlace seguro mediante Firebase Admin y entregar el HTML con ese proveedor, manteniendo los controles de identidad y límite de envíos. No publicar un vínculo de verificación en la web ni mostrarlo a otro usuario.
