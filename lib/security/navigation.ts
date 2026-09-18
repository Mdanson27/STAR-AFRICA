import type { LucideIcon } from 'lucide-react';
import { Activity, BriefcaseBusiness, CalendarDays, CircleDollarSign, ClipboardCheck, FileScan, FolderKanban, Landmark, LayoutDashboard, Package, ReceiptText, Settings, ShieldCheck, ShoppingCart, Users, WalletCards } from 'lucide-react';
import { hasPermission } from './permissions';

export type NavigationItem = { label:string; href:string; permission:string; icon:LucideIcon; system?:boolean };
export const navigationItems:NavigationItem[] = [
  {label:'Dashboard',href:'/dashboard',permission:'dashboard.executive.view',icon:LayoutDashboard},
  {label:'Bids & tenders',href:'/bids',permission:'bids.view',icon:ClipboardCheck},
  {label:'Projects',href:'/projects',permission:'projects.view',icon:FolderKanban},
  {label:'Procurement',href:'/procurement',permission:'procurement.view',icon:ShoppingCart},
  {label:'Suppliers',href:'/suppliers',permission:'suppliers.view',icon:Users},
  {label:'Inventory',href:'/inventory',permission:'inventory.view',icon:Package},
  {label:'Customers & sales',href:'/customers',permission:'customers.view',icon:Users},
  {label:'Invoices',href:'/invoices',permission:'invoices.view',icon:ReceiptText},
  {label:'Payments',href:'/payments',permission:'payments.view',icon:WalletCards},
  {label:'Finance & accounting',href:'/finance',permission:'finance.view',icon:CircleDollarSign},
  {label:'Banking',href:'/banking',permission:'banking.view',icon:Landmark},
  {label:'Payroll & HR',href:'/payroll',permission:'payroll.view',icon:BriefcaseBusiness},
  {label:'Documents & OCR',href:'/documents',permission:'documents.view',icon:FileScan},
  {label:'Reports',href:'/reports',permission:'reports.view',icon:Activity},
  {label:'Calendar',href:'/calendar',permission:'calendar.view',icon:CalendarDays},
  {label:'Administration',href:'/administration',permission:'administration.view',icon:ShieldCheck,system:true},
  {label:'Security & audit',href:'/administration/security',permission:'administration.view',icon:ShieldCheck,system:true},
  {label:'Settings',href:'/settings',permission:'settings.view',icon:Settings,system:true},
];

export const permittedNavigation = (permissions:readonly string[]) => navigationItems.filter((item)=>hasPermission(permissions,item.permission));

export const routePermission = (pathname:string) => {
  const match = [...navigationItems].sort((a,b)=>b.href.length-a.href.length).find((item)=>pathname===item.href||pathname.startsWith(`${item.href}/`));
  return match?.permission;
};
