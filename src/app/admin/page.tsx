import {requireRole} from '@/lib/security';import {Admin} from '@/components/admin';import {Account} from '@/components/account';export const metadata={title:'Administración',robots:{index:false,follow:false}};
export default async function Page(){try{const u=await requireRole(['admin','catalog','support','fulfillment']);return <Admin role={String(u.role)}/>}catch{return <Account admin/>}}
