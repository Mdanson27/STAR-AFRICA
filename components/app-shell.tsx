'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, Bell, BriefcaseBusiness, CalendarDays, ChevronRight, CircleDollarSign, ClipboardCheck, FileScan, FolderKanban, Landmark, LayoutDashboard, LogOut, Menu, Package, ReceiptText, Settings, ShieldCheck, ShoppingCart, Users, WalletCards, X } from 'lucide-react';
import { StarAfricaLogo } from './star-africa-logo';

const navigation = [
  ['Dashboard','/dashboard',LayoutDashboard], ['Bids & tenders','/bids',ClipboardCheck], ['Projects','/projects',FolderKanban], ['Procurement','/procurement',ShoppingCart],
  ['Suppliers','/suppliers',Users], ['Inventory','/inventory',Package], ['Customers & sales','/customers',Users], ['Invoices','/invoices',ReceiptText], ['Payments','/payments',WalletCards],
  ['Finance & accounting','/finance',CircleDollarSign], ['Banking','/banking',Landmark], ['Payroll & HR','/payroll',BriefcaseBusiness], ['Documents & OCR','/documents',FileScan], ['Reports','/reports',Activity], ['Calendar','/calendar',CalendarDays],
] as const;

export function AppShell({ children, active, user }: { children: React.ReactNode; active: string; user: { name:string; role:string } }) {
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const initials = useMemo(() => user.name.split(' ').slice(0,2).map((part) => part[0]).join('').toUpperCase(), [user.name]);
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
      <div className="sidebar-brand"><StarAfricaLogo size="medium" linked /><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X /></button></div>
      <nav className="nav-stack"><p className="nav-label">Workspace</p>{navigation.map(([label,path,Icon]) => <Link key={path} href={path} className={`nav-item ${active === label ? 'active' : ''}`}><Icon/><span>{label}</span>{label === 'Bids & tenders' ? <em>8</em> : <ChevronRight className="nav-arrow"/>}</Link>)}<p className="nav-label nav-label-spaced">System</p><Link href="/administration" className="nav-item"><ShieldCheck/><span>Administration</span><ChevronRight className="nav-arrow"/></Link><Link href="/settings" className="nav-item"><Settings/><span>Settings</span><ChevronRight className="nav-arrow"/></Link></nav>
      <div className="sidebar-footer"><div className="sync-dot"/><div><strong>Demo workspace</strong><span>Development providers active</span></div></div>
    </aside>
    {sidebarOpen ? <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"/> : null}
    <main className="main-surface"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu/></button><div className="breadcrumbs"><Link href="/dashboard">Star Africa</Link><ChevronRight/><strong>{active}</strong></div></div><div className="workspace-context"><span>STAR AFRICA OS</span><strong>{active}</strong></div><div className="topbar-actions"><Link className="icon-button notification-button" href="/notifications" aria-label="Notifications"><Bell/><span/></Link><div className="profile"><span className="avatar">{initials || 'SA'}</span><div><strong>{user.name}</strong><span>{user.role} · Demo</span></div></div><form action="/api/auth/logout" method="post"><button className="icon-button" type="submit" aria-label="Sign out" title="Sign out"><LogOut/></button></form></div></header>{children}</main>
  </div>;
}
