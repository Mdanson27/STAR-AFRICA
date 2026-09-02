'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity, Archive, Bell, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronRight,
  CircleDollarSign, ClipboardCheck, Download, FileScan, FolderKanban, Landmark,
  LayoutDashboard, Menu, Package, Plus, ReceiptText, Search, Settings, ShieldCheck,
  ShoppingCart, SlidersHorizontal, Users, WalletCards, X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { StarAfricaLogo } from '@/components/star-africa-logo';
import { StatusBadge } from '@/components/brand-primitives';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ModuleConfig } from '@/lib/modules';
import { modules } from '@/lib/modules';

const iconMap: Record<string, typeof LayoutDashboard> = {
  bids: ClipboardCheck, projects: FolderKanban, procurement: ShoppingCart, inventory: Package,
  customers: Users, invoices: ReceiptText, payments: WalletCards, finance: CircleDollarSign,
  banking: Landmark, payroll: BriefcaseBusiness, documents: FileScan, reports: Activity,
  calendar: CalendarDays, notifications: Bell, administration: ShieldCheck,
  integrations: Archive, settings: Settings, suppliers: Users,
};
const systemSlugs = new Set(['administration', 'integrations', 'settings']);

export function ModuleWorkspace({ config }: { config: ModuleConfig }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(config.tabs[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? config.rows.filter((row) => row.some((value) => value.toLowerCase().includes(needle))) : config.rows;
  }, [config.rows, query]);

  function exportCsv() {
    const rows = [config.columns, ...filteredRows];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${config.slug}-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell module-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-brand"><StarAfricaLogo size="medium" linked /><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X /></button></div>
        <nav className="nav-stack">
          <p className="nav-label">Workspace</p>
          <Link className="nav-item" href="/"><LayoutDashboard /><span>Dashboard</span></Link>
          {modules.filter((item) => !systemSlugs.has(item.slug)).map((item) => { const Icon = iconMap[item.slug]; return <Link key={item.slug} className={`nav-item ${item.slug === config.slug ? 'active' : ''}`} href={`/${item.slug}`}><Icon /><span>{item.title}</span><ChevronRight className="nav-arrow" /></Link>; })}
          <p className="nav-label nav-label-spaced">System</p>
          {modules.filter((item) => systemSlugs.has(item.slug)).map((item) => { const Icon = iconMap[item.slug]; return <Link key={item.slug} className={`nav-item ${item.slug === config.slug ? 'active' : ''}`} href={`/${item.slug}`}><Icon /><span>{item.title}</span><ChevronRight className="nav-arrow" /></Link>; })}
        </nav>
        <div className="sidebar-footer"><div className="sync-dot" /><div><strong>Demo workspace</strong><span>Development providers active</span></div></div>
      </aside>
      {sidebarOpen ? <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}

      <main className="main-surface">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumbs"><Link href="/">Star Africa</Link><ChevronRight /><strong>{config.title}</strong></div></div>
          <label className="global-search module-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} aria-label={`Search ${config.title}`} /><kbd>⌘ K</kbd></label>
          <div className="topbar-actions"><Link className="icon-button notification-button" href="/notifications" aria-label="Notifications"><Bell /><span /></Link><div className="profile"><span className="avatar">AN</span><div><strong>Amina Nsubuga</strong><span>Director · Demo workspace</span></div><ChevronDown /></div></div>
        </header>

        <div className="page-content module-content">
          <section className="module-heading">
            <div><p className="eyebrow">{config.eyebrow}</p><h1>{config.title}</h1><p>{config.description}</p></div>
            <div className="heading-actions"><Button variant="outline" size="lg" onClick={exportCsv}><Download /> Export</Button>{config.slug === 'invoices' ? <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} href="/invoices/preview">Print preview</Link> : null}{config.secondaryAction ? <Button variant="outline" size="lg" onClick={() => setCreateOpen(true)}>{config.secondaryAction}</Button> : null}<Button size="lg" onClick={() => { setSaved(false); setCreateOpen(true); }}><Plus /> {config.primaryAction}</Button></div>
          </section>

          {config.workflow ? <section className="workflow-strip" aria-label={`${config.title} workflow`}>{config.workflow.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong>{index < config.workflow!.length - 1 ? <ChevronRight /> : null}</div>)}</section> : null}

          <section className="module-stats">{config.stats.map((stat) => <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></article>)}</section>

          <section className="panel records-panel">
            <div className="module-tabs" role="tablist" aria-label={`${config.title} views`}>{config.tabs.map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
            <div className="records-toolbar"><div><h2>{activeTab}</h2><span>{filteredRows.length} demo records · permission-filtered view</span></div><div><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter records" /></label><button className="toolbar-button" disabled title="Advanced filter presets require the production data service" aria-label="Advanced filters unavailable in demo"><SlidersHorizontal /> Filters</button></div></div>
            {filteredRows.length ? <div className="table-scroll"><table className="records-table" aria-label={`${config.title} records`}><thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{filteredRows.map((row) => <tr key={row.join('-')} onClick={() => setSelectedRow(row)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') setSelectedRow(row); }}>{row.map((value, index) => <td key={`${value}-${index}`}>{index === 0 ? <strong>{value}</strong> : index === row.length - 1 ? <StatusBadge>{value}</StatusBadge> : value}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state"><Search /><h3>No matching records</h3><p>Try a different search or clear the current filter.</p><Button variant="outline" onClick={() => setQuery('')}>Clear search</Button></div>}
            <footer className="table-footer"><span>Showing {filteredRows.length} of {config.rows.length} records</span><div><button disabled>Previous</button><button className="active">1</button><button disabled>Next</button></div></footer>
          </section>

          <section className="module-support-grid">
            <article className="panel"><p className="panel-kicker">CONNECTED WORKFLOW</p><h3>Related records stay traceable</h3><p>Every {config.title.toLowerCase()} action preserves links to its source, approvals, documents, ledger entries, and audit history.</p><div className="trace-line"><span>Source</span><ChevronRight/><span>Operation</span><ChevronRight/><span>Accounting</span><ChevronRight/><span>Report</span></div></article>
            <article className="panel demo-provider-card"><span className="sync-dot"/><div><p className="panel-kicker">DEVELOPMENT MODE</p><h3>Safe provider boundary</h3><p>External actions are clearly labelled and never report a false production success.</p></div></article>
          </section>
        </div>
      </main>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="record-dialog"><DialogHeader><DialogTitle>{saved ? 'Saved to demo workspace' : config.primaryAction}</DialogTitle><DialogDescription>{saved ? 'The workflow is wired. Connect the database migration to persist this record.' : `Add a ${config.title.toLowerCase()} record with server validation and audit attribution.`}</DialogDescription></DialogHeader>{saved ? <div className="success-state"><span>✓</span><div><strong>Development provider confirmed the request</strong><p>No production transaction was created. This behaviour is intentionally labelled.</p></div></div> : <form id="record-form" onSubmit={(event) => { event.preventDefault(); setSaved(true); }} className="record-form"><label><span>Name or reference</span><input name="name" required placeholder={`${config.columns[0]}…`} /></label><label><span>Description</span><textarea name="description" required placeholder="Add operational context" /></label><div><label><span>Date</span><input name="date" type="date" required /></label><label><span>Status</span><select name="status"><option>Draft</option><option>Needs review</option><option>Approved</option></select></label></div></form>}<DialogFooter>{saved ? <Button onClick={() => setCreateOpen(false)}>Done</Button> : <><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" form="record-form">Save draft</Button></>}</DialogFooter></DialogContent></Dialog>

      <Dialog open={Boolean(selectedRow)} onOpenChange={(open) => { if (!open) setSelectedRow(null); }}><DialogContent className="record-dialog"><DialogHeader><DialogTitle>{selectedRow?.[1] ?? selectedRow?.[0]}</DialogTitle><DialogDescription>Connected record overview · demo workspace</DialogDescription></DialogHeader>{selectedRow ? <div className="detail-grid">{config.columns.map((column, index) => <div key={column}><span>{column}</span><strong>{selectedRow[index]}</strong></div>)}</div> : null}<div className="detail-audit"><ShieldCheck/><div><strong>Traceability active</strong><p>Changes to this record will be permission-checked and added to the audit trail.</p></div></div><DialogFooter><Button variant="outline" onClick={() => setSelectedRow(null)}>Close</Button><Button onClick={() => setSelectedRow(null)}>Open workspace</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
