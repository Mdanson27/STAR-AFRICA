'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { likelyDuplicate } from '@/lib/bids/domain';
type Row = {
  reference: string;
  title: string;
  organization: string;
  deadline: string;
  category: string;
  estimatedValue: string;
  currency: string;
};
const sample = `reference,title,organization,deadline,category,estimatedValue,currency\nMOWT/SUPLS/26/900,Protective equipment supply,Ministry of Works,2026-10-20,General supply,450000000,UGX`;
export function BidImport({
  existing,
}: {
  existing: {
    reference: string;
    organization: string;
    title: string;
    deadline: string;
  }[];
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [filename, setFilename] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<{
    inserted: number;
    duplicates: number;
    errors: number;
  } | null>(null);
  function parse(file: File) {
    setFilename(file.name);
    setSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const lines = text.split(/\r?\n/).filter(Boolean);
      const headers = (lines.shift() ?? '')
        .split(',')
        .map((item) => item.trim());
      const required = [
        'reference',
        'title',
        'organization',
        'deadline',
        'category',
        'estimatedValue',
        'currency',
      ];
      const missing = required.filter((key) => !headers.includes(key));
      if (missing.length) {
        setErrors([`Missing columns: ${missing.join(', ')}`]);
        setRows([]);
        return;
      }
      const parsed = lines.map((line) => {
        const values = line.split(',').map((item) => item.trim());
        return Object.fromEntries(
          headers.map((header, index) => [header, values[index] ?? '']),
        ) as Row;
      });
      const validation = parsed.flatMap((row, index) => {
        const issue = [];
        if (!row.reference || !row.title || !row.organization || !row.deadline)
          issue.push(`Row ${index + 2}: required value missing.`);
        if (!/^\d{4}-\d{2}-\d{2}/.test(row.deadline))
          issue.push(`Row ${index + 2}: deadline must be YYYY-MM-DD.`);
        return issue;
      });
      setErrors(validation);
      setRows(parsed);
    };
    reader.readAsText(file);
  }
  async function importRows() {
    setBusy(true);
    const response = await fetch('/api/bids/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filename, rows }),
    });
    const result = (await response.json()) as {
      inserted?: number;
      duplicates?: number;
      errors?: number;
      error?: string;
    };
    if (!response.ok) {
      setErrors([result.error ?? 'Import failed.']);
      setBusy(false);
      return;
    }
    setSummary({
      inserted: result.inserted ?? 0,
      duplicates: result.duplicates ?? 0,
      errors: result.errors ?? 0,
    });
    setBusy(false);
  }
  const duplicates = rows.filter((row) => likelyDuplicate(row, existing));
  return (
    <div className="page-content import-page">
      <Link className="back-link" href="/bids">
        <ArrowLeft /> Back to bids
      </Link>
      <div className="section-page-heading">
        <div>
          <p className="eyebrow">CSV IMPORT PROVIDER</p>
          <h1>Import opportunities</h1>
          <p>
            Upload, validate, preview and check likely duplicates before
            committing records.
          </p>
        </div>
      </div>
      <div className="import-steps">
        <span className={rows.length ? 'done' : 'active'}>
          <b>1</b> Upload
        </span>
        <span className={rows.length ? 'active' : ''}>
          <b>2</b> Validate & preview
        </span>
        <span className={summary ? 'done' : ''}>
          <b>3</b> Import summary
        </span>
      </div>
      <section className="panel import-upload">
        <label>
          <Upload />
          <strong>{filename || 'Choose a CSV opportunity file'}</strong>
          <span>
            Required headers: reference, title, organization, deadline,
            category, estimatedValue, currency
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) =>
              event.target.files?.[0] && parse(event.target.files[0])
            }
          />
        </label>
        <div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(sample)}`}
            download="star-africa-bid-import-template.csv"
          >
            <FileSpreadsheet /> Download CSV template
          </a>
          <button
            disabled
            title="Excel workbook parsing is not bundled in this demo; export the worksheet as CSV."
          >
            Excel workbook import
          </button>
        </div>
      </section>
      {errors.length ? (
        <div className="import-errors">
          <AlertTriangle />
          <div>
            <strong>Validation requires attention</strong>
            {errors.map((error) => (
              <span key={error}>{error}</span>
            ))}
          </div>
        </div>
      ) : null}
      {rows.length ? (
        <section className="panel workspace-panel full">
          <header>
            <div>
              <p className="panel-kicker">PREVIEW & DUPLICATE DETECTION</p>
              <h2>{rows.length} rows ready for review</h2>
            </div>
            <span>{duplicates.length} likely duplicates</span>
          </header>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Tender</th>
                  <th>Organisation</th>
                  <th>Deadline</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const duplicate = likelyDuplicate(row, existing);
                  return (
                    <tr key={`${row.reference}-${index}`}>
                      <td>
                        <strong>{row.reference}</strong>
                      </td>
                      <td>{row.title}</td>
                      <td>{row.organization}</td>
                      <td>{row.deadline}</td>
                      <td>{row.category}</td>
                      <td>
                        {row.currency}{' '}
                        {Number(row.estimatedValue).toLocaleString()}
                      </td>
                      <td>
                        {duplicate ? (
                          <span className="deadline deadline-approaching">
                            Duplicate: {duplicate.reference}
                          </span>
                        ) : (
                          <span className="valid-row">
                            <Check /> Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <footer className="import-footer">
            <span>
              Duplicates will be skipped and included in the immutable import
              summary.
            </span>
            <Button
              disabled={Boolean(errors.length) || busy}
              onClick={importRows}
            >
              {busy
                ? 'Importing…'
                : `Import ${rows.length - duplicates.length} opportunities`}
            </Button>
          </footer>
        </section>
      ) : null}
      {summary ? (
        <section className="import-summary">
          <Check />
          <div>
            <strong>Import completed</strong>
            <span>
              {summary.inserted} inserted · {summary.duplicates} duplicates
              skipped · {summary.errors} errors
            </span>
            <Link href="/bids">Return to opportunity register</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
