import { NextResponse } from 'next/server';
import {
  generateReportRows,
  reportDefinitions,
} from '@/lib/reports/server';
import { guardApi } from '@/lib/security/api-guard';
import { writeAuditLog } from '@/lib/security/production-auth';

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const definition = reportDefinitions.find((item) => item.slug === slug);
  if (!definition) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  }

  const guard = await guardApi(request, {
    permission: 'reports.view',
    action: 'reports.export',
    maxRequests: 30,
    windowMs: 15 * 60 * 1000,
  });
  if ('response' in guard) return guard.response;
  const { session } = guard;

  const rows = await generateReportRows(slug);
  const header = definition.columns.map(csvCell).join(',');
  const lines = rows.map((row) =>
    definition.columns
      .map((column) => csvCell((row as Record<string, unknown>)[column]))
      .join(','),
  );
  const csv = '\uFEFF' + [header, ...lines].join('\r\n');

  await writeAuditLog({
    request,
    userId: session.userId,
    companyId: session.companyId,
    action: 'report.exported',
    entityType: 'report',
    entityId: slug,
    newValue: { format: 'csv', rows: rows.length },
  }).catch(() => undefined);

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="star-africa-${slug}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
