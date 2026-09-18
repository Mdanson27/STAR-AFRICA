'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type SupplierRow = {
  id: string;
  code: string;
  name: string;
  tin: string | null;
  vatRegistered: boolean;
  creditTermsDays: number;
  email: string | null;
  phone: string | null;
  address: string | null;
  fax: string | null;
  status: string;
  sourceSystem: string | null;
  sourceRef: string | null;
  sourceImportedAt: number | null;
};

export function SuppliersWorkspace({
  rows,
  canCreate,
}: {
  rows: SupplierRow[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    tin: '',
    email: '',
    phone: '',
    address: '',
    fax: '',
    creditTermsDays: '0',
    vatRegistered: false,
  });

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [
        row.code,
        row.name,
        row.email ?? '',
        row.phone ?? '',
        row.address ?? '',
        row.sourceRef ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [query, rows]);

  async function createSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          creditTermsDays: Number(form.creditTermsDays || 0),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (!response.ok) {
        if (result.code === 'PASSWORD_CHANGE_REQUIRED') {
          router.push('/account/security');
          return;
        }
        setError(result.error ?? 'Unable to create supplier.');
        return;
      }
      setShowCreate(false);
      setForm({
        code: '',
        name: '',
        tin: '',
        email: '',
        phone: '',
        address: '',
        fax: '',
        creditTermsDays: '0',
        vatRegistered: false,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-content suppliers-page">
      <section className="module-heading">
        <div>
          <p className="eyebrow">SUPPLIER RELATIONSHIPS</p>
          <h1>Suppliers</h1>
          <p>
            Maintain live supplier records while preserving the original
            QuickBooks source reference for migrated suppliers.
          </p>
        </div>
        {canCreate ? (
          <Button onClick={() => setShowCreate(true)}>
            <Plus />
            New supplier
          </Button>
        ) : null}
      </section>

      <section className="supplier-summary-grid">
        <article>
          <span>Active suppliers</span>
          <strong>{rows.length}</strong>
          <small>Production records</small>
        </article>
        <article>
          <span>Imported from QuickBooks</span>
          <strong>
            {rows.filter((row) => row.sourceSystem === 'QuickBooks').length}
          </strong>
          <small>Source references retained</small>
        </article>
        <article>
          <span>VAT registered</span>
          <strong>{rows.filter((row) => row.vatRegistered).length}</strong>
          <small>Current supplier setting</small>
        </article>
      </section>

      <section className="panel supplier-table-panel">
        <header className="records-toolbar">
          <div>
            <h2>Supplier register</h2>
            <span>{filtered.length} records</span>
          </div>
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search suppliers"
            />
          </label>
        </header>

        <div className="table-scroll">
          <table className="records-table supplier-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Terms</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      <small>{row.code}{row.tin ? ` · TIN ${row.tin}` : ''}</small>
                    </td>
                    <td>
                      <span>{row.phone || '—'}</span>
                      <small>{row.email || 'No email recorded'}</small>
                    </td>
                    <td>{row.address || '—'}</td>
                    <td>{row.creditTermsDays ? `${row.creditTermsDays} days` : 'Due on receipt / not set'}</td>
                    <td>
                      {row.sourceSystem === 'QuickBooks' ? (
                        <span className="quickbooks-source-badge">
                          Imported from QuickBooks · Ref {row.sourceRef}
                        </span>
                      ) : (
                        <span className="production-badge">Star Africa OS</span>
                      )}
                    </td>
                    <td>{row.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="table-empty-cell">
                    No suppliers match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showCreate ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="supplier-create-dialog" role="dialog" aria-modal="true" aria-labelledby="supplier-create-title">
            <header>
              <div>
                <p className="eyebrow">NEW PRODUCTION RECORD</p>
                <h2 id="supplier-create-title">Create supplier</h2>
                <p>Only capture information that is known. It can be completed later with audit history.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close">
                <X />
              </button>
            </header>
            <form onSubmit={createSupplier}>
              <div className="form-grid">
                <label><span>Supplier code *</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
                <label><span>Supplier name *</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                <label><span>TIN</span><input value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} /></label>
                <label><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
                <label><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                <label><span>Credit terms (days)</span><input type="number" min="0" value={form.creditTermsDays} onChange={(e) => setForm({ ...form, creditTermsDays: e.target.value })} /></label>
                <label className="wide"><span>Address</span><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
                <label><span>Fax</span><input value={form.fax} onChange={(e) => setForm({ ...form, fax: e.target.value })} /></label>
                <label className="checkbox-label"><input type="checkbox" checked={form.vatRegistered} onChange={(e) => setForm({ ...form, vatRegistered: e.target.checked })} /><span>VAT registered</span></label>
              </div>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <footer>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create supplier'}</Button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
