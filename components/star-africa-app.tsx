'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity, Archive, Bell, BriefcaseBusiness, CalendarDays, ChevronDown,
  ChevronRight, CircleDollarSign, ClipboardCheck, FileScan, FolderKanban,
  Landmark, LayoutDashboard, Menu, Package, Plus, ReceiptText, Search,
  Settings, ShieldCheck, ShoppingCart, Sparkles, Users, WalletCards, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarAfricaLogo } from '@/components/star-africa-logo';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { activity, attentionItems, cashFlow, kpis, money, projects } from '@/lib/demo-data';

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }, { label: 'Bids & tenders', path: '/bids', icon: ClipboardCheck, count: 8 },
  { label: 'Projects', path: '/projects', icon: FolderKanban, count: 12 }, { label: 'Procurement', path: '/procurement', icon: ShoppingCart, count: 5 },
  { label: 'Suppliers', path: '/suppliers', icon: Users }, { label: 'Inventory', path: '/inventory', icon: Package }, { label: 'Customers & sales', path: '/customers', icon: Users },
  { label: 'Invoices', path: '/invoices', icon: ReceiptText, count: 9 }, { label: 'Payments', path: '/payments', icon: WalletCards },
  { label: 'Finance & accounting', path: '/finance', icon: CircleDollarSign }, { label: 'Banking', path: '/banking', icon: Landmark },
  { label: 'Payroll & HR', path: '/payroll', icon: BriefcaseBusiness }, { label: 'Documents & OCR', path: '/documents', icon: FileScan, count: 3 },
  { label: 'Reports', path: '/reports', icon: Activity }, { label: 'Calendar', path: '/calendar', icon: CalendarDays },
];

const quickActions = [
  ['New bid', 'Track an opportunity and its requirements', ClipboardCheck, '/bids/opportunities/new'],
  ['New project', 'Create from scratch or a winning bid', FolderKanban, '/projects'],
  ['New invoice', 'Bill a client with supporting documents', ReceiptText, '/invoices'],
  ['Record expense', 'Capture a project or operating cost', CircleDollarSign, '/finance'],
  ['New purchase order', 'Continue an approved request', ShoppingCart, '/procurement'],
  ['Upload document', 'Scan a receipt or attach a file', FileScan, '/documents'],
] as const;

function CashFlowChart() {
  const x = (index: number) => 42 + index * 104;
  const y = (value: number) => 190 - value * 0.18;
  const incomePoints = cashFlow.map((item, index) => `${x(index)},${y(item.income)}`).join(' ');
  const expensePoints = cashFlow.map((item, index) => `${x(index)},${y(item.expenses)}`).join(' ');
  const area = `M ${x(0)} 190 L ${cashFlow.map((item, index) => `${x(index)} ${y(item.income)}`).join(' L ')} L ${x(cashFlow.length - 1)} 190 Z`;
  return <svg className="cash-svg" viewBox="0 0 600 220" aria-labelledby="cashflow-title"><title id="cashflow-title">Income rose from UGX 420 million in March to UGX 880 million in August while expenses rose from UGX 310 million to UGX 535 million.</title><defs><linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--brand-primary)" stopOpacity=".24"/><stop offset="1" stopColor="var(--brand-primary)" stopOpacity=".02"/></linearGradient></defs>{[40,80,120,160].map((line) => <line key={line} x1="35" y1={line} x2="570" y2={line} stroke="var(--border)" strokeDasharray="3 5"/>)}<path d={area} fill="url(#incomeArea)"/><polyline points={incomePoints} fill="none" stroke="var(--brand-primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/><polyline points={expensePoints} fill="none" stroke="var(--chart-3)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>{cashFlow.map((item, index) => <g key={item.month}><circle cx={x(index)} cy={y(item.income)} r="3.5" fill="var(--surface)" stroke="var(--brand-primary)" strokeWidth="2"/><text x={x(index)} y="212" textAnchor="middle">{item.month}</text></g>)}</svg>;
}

export function StarAfricaApp({ userName, userRole, canCreateBids = false }: { userName: string; userRole: string; canCreateBids?: boolean }) {
  const active = 'Dashboard';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [period, setPeriod] = useState('This financial year');
  const initials = useMemo(() => userName.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(''), [userName]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-brand">
          <StarAfricaLogo size="medium" linked />
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <nav className="nav-stack">
          <p className="nav-label">Workspace</p>
          {navigation.map((item) => (
            <Link key={item.label} href={item.path} className={`nav-item ${active === item.label ? 'active' : ''}`}>
              <item.icon /><span>{item.label}</span>{item.count ? <em>{item.count}</em> : null}{item.label !== 'Dashboard' && !item.count ? <ChevronRight className="nav-arrow" /> : null}
            </Link>
          ))}
          <p className="nav-label nav-label-spaced">System</p>
          {([['Administration', '/administration', ShieldCheck], ['Integrations', '/integrations', Archive], ['Settings', '/settings', Settings]] as const).map(([label, path, Icon]) => (
            <Link key={label} href={path} className="nav-item"><Icon /><span>{label}</span><ChevronRight className="nav-arrow" /></Link>
          ))}
        </nav>
        <div className="sidebar-footer"><div className="sync-dot" /><div><strong>Demo workspace</strong><span>Development providers active</span></div></div>
      </aside>
      {sidebarOpen ? <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" /> : null}

      <main className="main-surface">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
            <div className="breadcrumbs"><span>Star Africa</span><ChevronRight /><strong>{active}</strong></div>
          </div>
          <button className="global-search" onClick={() => setSearchOpen(true)}><Search /><span>Search anything…</span><kbd>⌘ K</kbd></button>
          <div className="topbar-actions">
            <Link className="icon-button notification-button" href="/notifications" aria-label="Notifications"><Bell /><span /></Link>
            <div className="profile"><span className="avatar">{initials || 'SA'}</span><div><strong>{userName}</strong><span>{userRole}</span></div><ChevronDown /></div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><p className="eyebrow"><Sparkles /> Executive command centre</p><h1>Good morning, {userName.split(/[\s@]/)[0]}</h1><p className="overview-title">Star Africa Operations Overview</p><p>Here’s how money and operations are moving across Star Africa.</p></div>
            <div className="heading-actions">
              <label className="period-select"><CalendarDays /><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Reporting period"><option>This month</option><option>This quarter</option><option>This financial year</option></select><ChevronDown /></label>
              <Button size="lg" onClick={() => setQuickOpen(true)}><Plus /> Quick create</Button>
            </div>
          </section>

          <section className="kpi-grid" aria-label="Key financial indicators">
            {kpis.map((kpi, index) => <article className="kpi-card" key={kpi.label}><div className="kpi-top"><span>{kpi.label}</span><span className={`metric-icon metric-${index}`}><CircleDollarSign /></span></div><strong>{money(kpi.value)}</strong><p className={kpi.tone}>{kpi.tone === 'positive' ? '↗' : kpi.tone === 'warning' ? '!' : '•'} {kpi.delta}</p></article>)}
          </section>

          <section className="dashboard-grid">
            <article className="panel cash-panel">
              <div className="panel-header"><div><p className="panel-kicker">FINANCIAL PULSE</p><h2>Cash flow</h2><span>Collections versus operating outflow · UGX millions</span></div><div className="chart-legend"><span><i className="income-dot" />Income</span><span><i className="expense-dot" />Expenses</span></div></div>
              <div className="chart-wrap" aria-label="Monthly cash flow chart">
                <CashFlowChart />
              </div>
              <div className="cash-summary"><div><span>Net cash movement</span><strong>+ UGX 345M</strong></div><div><span>Collection efficiency</span><strong>82.4%</strong></div><Link href="/finance">Open cash flow report <ChevronRight /></Link></div>
            </article>

            <article className="panel attention-panel">
              <div className="panel-header"><div><p className="panel-kicker">ACTION QUEUE</p><h2>Needs attention</h2><span>3 high-priority items</span></div><Link className="text-button" href="/notifications">View all</Link></div>
              <div className="attention-list">{attentionItems.map((item, index) => <button key={item.title} onClick={() => window.location.assign(item.kind === 'Stock' ? '/inventory' : item.kind === 'Bid' ? '/bids' : '/invoices')}><span className={`attention-icon attention-${index}`}>{index === 0 ? <ReceiptText /> : index === 1 ? <ClipboardCheck /> : <Package />}</span><span className="attention-copy"><em>{item.kind}</em><strong>{item.title}</strong><small>{item.meta}</small></span><span className="attention-level">{item.level}</span></button>)}</div>
            </article>
          </section>

          <section className="panel projects-panel">
            <div className="panel-header"><div><p className="panel-kicker">DELIVERY & MARGIN</p><h2>Project performance</h2><span>Active contracts ranked by current delivery</span></div><Link className="text-button" href="/projects">All projects <ChevronRight /></Link></div>
            <div className="table-scroll"><table aria-label="Active project performance"><thead><tr><th>Project</th><th>Stage</th><th>Progress</th><th>Budget</th><th>Actual spend</th><th>Forecast profit</th></tr></thead><tbody>{projects.map((project) => <tr key={project.code}><td><strong>{project.name}</strong><span>{project.code} · {project.client}</span></td><td><span className="stage-badge">{project.stage}</span></td><td><div className="progress-cell"><progress aria-label={`${project.name} progress`} value={project.progress} max={100} /><strong>{project.progress}%</strong></div></td><td>{money(project.budget)}</td><td>{money(project.spent)}</td><td className="profit-cell">{money(project.profit)}</td></tr>)}</tbody></table></div>
          </section>

          <section className="bottom-grid">
            <article className="panel metric-strip"><div><span>Accounts payable</span><strong>{money(428_300_000)}</strong><small>UGX 88.4M due this week</small></div><div><span>Retention outstanding</span><strong>{money(274_700_000)}</strong><small>UGX 42.5M eligible now</small></div><div><span>Active bids</span><strong>8</strong><small>Combined value UGX 6.2B</small></div><div><span>Win rate</span><strong>36.8%</strong><small>7 of 19 awarded YTD</small></div></article>
            <article className="panel activity-panel"><div className="panel-header"><div><p className="panel-kicker">AUDITABLE BY DESIGN</p><h2>Recent activity</h2></div><Link className="text-button" href="/administration">Open log</Link></div><div className="activity-list">{activity.map((item) => <div key={item.title}><i className={item.tone}/><span><strong>{item.title}</strong><small>{item.meta}</small></span><time>{item.time}</time></div>)}</div></article>
          </section>
        </div>
      </main>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}><DialogContent className="quick-dialog"><DialogHeader><DialogTitle>Quick create</DialogTitle><DialogDescription>Start a connected Star Africa workflow.</DialogDescription></DialogHeader><div className="quick-grid">{quickActions.filter(([title]) => title !== 'New bid' || canCreateBids).map(([title, description, Icon, path]) => <button key={title} onClick={() => window.location.assign(path)}><span><Icon /></span><div><strong>{title}</strong><small>{description}</small></div><ChevronRight /></button>)}</div>{!canCreateBids ? <p className="demo-note"><ShieldCheck /> Your role can view bids but cannot create opportunities.</p> : <p className="demo-note"><span /> Demo workspace · server permissions are active.</p>}</DialogContent></Dialog>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}><DialogContent className="search-dialog"><DialogHeader><DialogTitle>Search Star Africa</DialogTitle><DialogDescription>Find projects, bids, invoices, people, or documents.</DialogDescription></DialogHeader><div className="search-field"><Search /><input aria-label="Global search" placeholder="Try ‘Jinja’ or ‘INV-2026’" /></div><div className="search-results"><p>Suggested</p>{projects.slice(0, 2).map((project) => <button key={project.code} onClick={() => window.location.assign('/projects')}><FolderKanban/><span><strong>{project.name}</strong><small>{project.code} · {project.client}</small></span><kbd>↵</kbd></button>)}</div></DialogContent></Dialog>
    </div>
  );
}
