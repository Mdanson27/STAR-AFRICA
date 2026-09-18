'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/brand-primitives';
import type { ModuleConfig } from '@/lib/modules';

export function GenericWorkspace({
  config,
  canCreate,
}: {
  config: ModuleConfig;
  canCreate: boolean;
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState(config.tabs[0]);

  const rows = useMemo(
    () =>
      config.rows.filter(
        (row) =>
          !query ||
          row.some((cell) =>
            cell.toLowerCase().includes(query.toLowerCase()),
          ),
      ),
    [query, config.rows],
  );

  function exportCsv() {
    if (!rows.length) return;
    const csv = [config.columns, ...rows]
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${config.slug}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-content module-content">
      <section className="module-heading">
        <div>
          <p className="eyebrow">{config.eyebrow}</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <div className="heading-actions">
          {rows.length ? (
            <Button variant="outline" onClick={exportCsv}>
              <Download />
              Export
            </Button>
          ) : null}
          {canCreate && config.primaryHref ? (
            <Button render={<Link href={config.primaryHref} />}>
              <Plus />
              {config.primaryAction}
            </Button>
          ) : null}
        </div>
      </section>

      {config.workflow ? (
        <section className="workflow-strip">
          {config.workflow.map((step, index) => (
            <div key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </section>
      ) : null}

      <section className="module-stats">
        {config.stats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        ))}
      </section>

      <section className="panel records-panel">
        <div className="module-tabs">
          {config.tabs.map((tab) => (
            <button
              className={tab === activeTab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="records-toolbar">
          <div>
            <h2>{activeTab}</h2>
            <span>{rows.length} production records</span>
          </div>
          {config.rows.length ? (
            <div>
              <label>
                <Search />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search records"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="table-scroll">
          <table className="records-table">
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.join('-')}>
                    {row.map((value, index) => (
                      <td key={`${index}-${value}`}>
                        {index === 0 ? (
                          <strong>{value}</strong>
                        ) : index === row.length - 1 ? (
                          <StatusBadge>{value}</StatusBadge>
                        ) : (
                          value
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={config.columns.length}
                    className="table-empty-cell"
                  >
                    No production records are available in this section yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
