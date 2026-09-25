export const cop=(n:number)=>`$${new Intl.NumberFormat('es-CO').format(n)} COP`;
export const date=(n:number)=>new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeZone:'America/Bogota'}).format(n);
export const statusLabels:Record<string,string>={pending_payment:'Pendiente de pago',paid:'Pagado',preparing:'En preparación',shipped:'Enviado',delivered:'Entregado',cancelled:'Cancelado',manual_review:'Requiere revisión',PENDING:'Pendiente',APPROVED:'Aprobado',DECLINED:'Rechazado',ERROR:'Error',VOIDED:'Anulado',unfulfilled:'Por preparar'};
