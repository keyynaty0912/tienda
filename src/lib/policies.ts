export const policies: Record<
  string,
  { title: string; content: string; source?: string }
> = {
  envios: {
    title: "Envíos y cobertura",
    content:
      "Borrador pendiente de completar con la operación real del negocio.\n\nLa cobertura, tarifa y plazo de entrega se informarán según el departamento y municipio seleccionado, antes de confirmar el pedido. Un destino que no tenga una tarifa activa no permite continuar.\n\nPendiente de definir: transportadoras, tiempos de preparación, horarios de corte, tratamiento de direcciones incorrectas, intentos de entrega y canales de atención. No se promete cobertura nacional.\n\nLa tarifa de demostración no constituye una oferta comercial.",
  },
  cambios: {
    title: "Cambio comercial por talla",
    content:
      "Borrador pendiente de revisión.\n\nEl cambio comercial de talla es un beneficio que el negocio debe definir por separado de la garantía y de los derechos legales del consumidor.\n\nPendiente de completar: plazo voluntario, disponibilidad de tallas, condiciones de la prenda, costos y procedimiento. No se limita mediante este borrador la garantía ni los derechos que correspondan legalmente.\n\nLa solicitud se puede registrar desde la consulta segura del pedido cuando la tienda esté habilitada.",
  },
  garantias: {
    title: "Garantía",
    content:
      "Borrador pendiente de revisión para los productos reales.\n\nLa garantía atiende problemas de calidad, idoneidad o seguridad de la prenda. Su trámite es diferente de un cambio voluntario por talla.\n\nPendiente de completar: canales de reclamación, término aplicable, información necesaria, recepción de la prenda y procedimiento para responder. No se han definido exclusiones generales.\n\nLa solución debe determinarse según las circunstancias y el régimen aplicable; no se sustituye por una prohibición de devoluciones.",
    source:
      "https://sedeelectronica.sic.gov.co/temas/proteccion-al-consumidor/derechos-y-deberes/fallas-en-un-producto",
  },
  retracto: {
    title: "Derecho de retracto",
    content:
      "Borrador pendiente de revisión.\n\nLa SIC informa que, en las ventas a distancia en las que proceda el retracto, el plazo para ejercerlo es de cinco días hábiles desde la entrega del bien. Su aplicación y excepciones deben revisarse para el producto y la operación concreta.\n\nPendiente de completar con revisión jurídica: canal de recepción, instrucciones de devolución, distribución de costos según el caso y procedimiento de reintegro. Este borrador no impone una exclusión general de retracto para la ropa infantil.",
    source:
      "https://sedeelectronica.sic.gov.co/noticias/se-arrepintio-de-una-compra-y-no-sabe-que-hacer",
  },
  reversion: {
    title: "Reversión del pago",
    content:
      "Borrador pendiente de revisión.\n\nLa reversión del pago es distinta del retracto y del reembolso gestionado directamente por el comercio. El artículo 51 del Estatuto del Consumidor regula su aplicación en las situaciones y condiciones que allí se establecen.\n\nPendiente de completar: canales, información y procedimiento para tramitar reclamaciones y orientar al comprador respecto de su entidad financiera. Deben validarse los términos vigentes antes de publicar esta política.",
    source:
      "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306",
  },
  devoluciones: {
    title: "Devoluciones y reembolsos",
    content:
      "Borrador pendiente de revisión.\n\nUna devolución puede derivarse de un cambio comercial, una garantía o un retracto. La evaluación y los costos dependen del motivo y de las condiciones aplicables.\n\nLos reembolsos deben vincularse al pago original y contar con registro de su causa, valor, respuesta y comprobante.\n\nPendiente de completar: dirección de recepción, inspección cuando proceda, plazos de respuesta y reintegro y mecanismos disponibles del proveedor de pagos. No hay reembolsos automáticos conectados en esta versión.",
  },
  privacidad: {
    title: "Privacidad y tratamiento de datos",
    content:
      "Borrador pendiente de completar y revisar.\n\nResponsable: pendiente de identificar. Dirección y canal para derechos del titular: pendientes de configurar.\n\nEl diseño recoge datos de compradores adultos para tramitar compras, entregas, atención al cliente y obligaciones aplicables. No solicita perfiles ni fechas de nacimiento de menores. La autorización opcional de promociones se presenta separada y sin selección previa.\n\nEl titular puede solicitar conocer, actualizar y rectificar sus datos, y solicitar supresión o revocar la autorización cuando proceda. Deben definirse los canales y el procedimiento del negocio.\n\nLa tienda usa almacenamiento local para bolsa y favoritos y cookies de sesión cuando se inicia sesión o se crea una reserva. No integra publicidad ni analítica no esencial.\n\nPendiente de definir: conservación, encargados y transferencias de datos, bases jurídicas, canales de atención y contenido final de las autorizaciones.",
    source:
      "https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/politicas-de-tratamiento-de-datos-personales",
  },
  terminos: {
    title: "Términos de compra",
    content:
      "Borrador pendiente de datos reales y revisión jurídica.\n\nVendedor, identificación, dirección y contacto: por completar. Las compras se expresan en pesos colombianos. Precios, disponibilidad, impuestos aplicables y entrega deben revisarse antes de confirmar.\n\nLos pagos se tramitarán en el checkout oficial del proveedor cuando esté habilitado. La confirmación del pago depende de su verificación en el servidor. Una reserva pendiente no equivale a un pago aprobado.\n\nEste sistema no emite por sí mismo facturas electrónicas validadas por la DIAN. Debe configurarse la facturación que corresponda al negocio.\n\nAntes de habilitar ventas deben revisarse las condiciones de catálogo, identificación del vendedor, atención, entrega, garantías, retracto, privacidad y registro de la transacción.",
    source:
      "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306",
  },
};
