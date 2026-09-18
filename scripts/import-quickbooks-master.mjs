import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required.');

const COMPANY_ID = 'company-star-africa';
const BATCH_ID = 'qb-iif-master-2026-09-18';
const SOURCE_SYSTEM = 'QuickBooks';
const SOURCE_FILE = 'QUICKBOOKS STAR AFRICA LOGISTICS.IIF';
const EXPORT_DATE = '2026-09-18';
const EXPORT_TIMESTAMP = '1789722481 (2026-09-18 12:08:01 EAT)';
const IMPORTED_AT = 1789722481000;

const counts = {
  accounts: 80,
  items_services: 25,
  customers: 5,
  vendors: 22,
  customer_types: 4,
  job_types: 2,
  vendor_types: 5,
  shipping_methods: 4,
  payment_methods: 9,
  invoice_memo_templates: 5,
  payment_terms: 7,
  sales_tax_codes: 2,
  custom_item_dictionary_rows: 15,
  custom_name_dictionary_rows: 30,
  transactions_present: false,
};

async function loadJson(name) {
  return JSON.parse(
    await readFile(new URL(`../data/quickbooks/${name}`, import.meta.url), 'utf8'),
  );
}

function moneyToMinor(raw) {
  const cleaned = String(raw ?? '0').replaceAll(',', '').trim();
  const negative = cleaned.startsWith('-');
  const unsigned = negative ? cleaned.slice(1) : cleaned;
  const [wholeRaw = '0', fractionRaw = ''] = unsigned.split('.');
  const whole = BigInt(wholeRaw || '0');
  const fraction = BigInt((fractionRaw + '00').slice(0, 2));
  const value = whole * 100n + fraction;
  return (negative ? -value : value).toString();
}

const accountType = {
  BANK: ['asset', 'debit'],
  AR: ['asset', 'debit'],
  OCASSET: ['asset', 'debit'],
  FIXASSET: ['asset', 'debit'],
  AP: ['liability', 'credit'],
  OCLIAB: ['liability', 'credit'],
  EQUITY: ['equity', 'credit'],
  INC: ['income', 'credit'],
  COGS: ['expense', 'debit'],
  EXP: ['expense', 'debit'],
  NONPOSTING: ['nonposting', 'debit'],
};

async function provenance(client, {
  entityType,
  entityId,
  sourceRecordType,
  sourceRef,
  snapshot,
}) {
  await client.query(
    `INSERT INTO record_provenance
      (id,batch_id,entity_type,entity_id,source_record_type,source_ref,source_snapshot_json,imported_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (batch_id,entity_type,entity_id)
     DO UPDATE SET source_ref=EXCLUDED.source_ref,
       source_snapshot_json=EXCLUDED.source_snapshot_json,
       imported_at=EXCLUDED.imported_at`,
    [
      `prov-${entityType}-${String(sourceRef).replace(/[^a-z0-9_-]/gi, '-')}`,
      BATCH_ID,
      entityType,
      entityId,
      sourceRecordType,
      sourceRef,
      JSON.stringify(snapshot),
      IMPORTED_AT,
    ],
  );
}

const [accounts, items, customers, vendors, references] = await Promise.all([
  loadJson('accounts.json'),
  loadJson('items.json'),
  loadJson('customers.json'),
  loadJson('vendors.json'),
  loadJson('reference-values.json'),
]);

const client = new Client({
  connectionString: databaseUrl,
  ssl: /localhost|127\.0\.0\.1/.test(databaseUrl)
    ? false
    : { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query('BEGIN');

  await client.query(
    `INSERT INTO data_import_batches
      (id,company_id,source_system,source_file_name,source_export_date,source_export_timestamp,status,record_counts_json,notes,started_at,completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,'completed',$7,$8,$9,$9)
     ON CONFLICT (id) DO UPDATE SET
       status='completed',
       record_counts_json=EXCLUDED.record_counts_json,
       notes=EXCLUDED.notes,
       completed_at=EXCLUDED.completed_at`,
    [
      BATCH_ID,
      COMPANY_ID,
      SOURCE_SYSTEM,
      SOURCE_FILE,
      EXPORT_DATE,
      EXPORT_TIMESTAMP,
      JSON.stringify(counts),
      'Authoritative QuickBooks IIF master-data import. The source export contains no TRNS/SPL blocks, therefore no invoices, bills, receipts, payments, cheques or journal transactions were imported.',
      IMPORTED_AT,
    ],
  );

  const accountIds = new Map(
    accounts.map((row) => [row['Account name'], `qb-account-${row.Ref}`]),
  );

  for (const row of accounts) {
    const id = `qb-account-${row.Ref}`;
    const [type = 'other', normalBalance = 'debit'] =
      accountType[row.Type] ?? [];
    const parentName = row['Account name'].includes(':')
      ? row['Account name'].slice(0, row['Account name'].lastIndexOf(':'))
      : null;
    const parentId = parentName ? accountIds.get(parentName) ?? null : null;
    const code = row['Account no.'] || `QB-ACC-${row.Ref}`;

    await client.query(
      `INSERT INTO accounts
        (id,company_id,code,name,type,normal_balance,parent_id,legacy_opening_balance_minor,legacy_opening_balance_raw,source_system,source_ref,source_imported_at,active,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$12,$12)
       ON CONFLICT (company_id,code) DO UPDATE SET
         name=EXCLUDED.name,
         type=EXCLUDED.type,
         normal_balance=EXCLUDED.normal_balance,
         parent_id=EXCLUDED.parent_id,
         legacy_opening_balance_minor=EXCLUDED.legacy_opening_balance_minor,
         legacy_opening_balance_raw=EXCLUDED.legacy_opening_balance_raw,
         source_system=EXCLUDED.source_system,
         source_ref=EXCLUDED.source_ref,
         source_imported_at=EXCLUDED.source_imported_at,
         active=EXCLUDED.active,
         updated_at=EXCLUDED.updated_at`,
      [
        id,
        COMPANY_ID,
        code,
        row['Account name'],
        type,
        normalBalance,
        parentId,
        moneyToMinor(row['Exported amount']),
        row['Exported amount'],
        SOURCE_SYSTEM,
        row.Ref,
        IMPORTED_AT,
        row.Hidden === 'Y' ? 0 : 1,
      ],
    );

    await provenance(client, {
      entityType: 'account',
      entityId: id,
      sourceRecordType: 'ACCNT',
      sourceRef: row.Ref,
      snapshot: row,
    });
  }

  for (const row of customers) {
    const ref = row['Reference number'];
    const id = `qb-customer-${ref}`;
    const billing = [1, 2, 3, 4, 5]
      .map((index) => row[`Billing address ${index}`])
      .filter((value) => value && value.toLowerCase() !== row.name.toLowerCase());
    const shipping = [1, 2, 3, 4, 5]
      .map((index) => row[`Shipping address ${index}`])
      .filter((value) => value && value.toLowerCase() !== row.name.toLowerCase());
    const address = [...billing, ...shipping.filter((x) => !billing.includes(x))]
      .join(', ') || null;

    await client.query(
      `INSERT INTO customers
        (id,company_id,code,name,customer_type,category,vat_registered,email,phone,country,address,preferred_currency,payment_terms,due_days,retention_applicable,retention_basis_points,credit_limit_minor,source,notes,status,source_system,source_ref,source_imported_at,created_at,updated_at)
       VALUES ($1,$2,$3,$4,'Company','Imported',$5,$6,$7,'Uganda',$8,'UGX','Imported from QuickBooks',0,0,0,'0','QuickBooks',$9,'active','QuickBooks',$10,$11,$11,$11)
       ON CONFLICT (company_id,code) DO UPDATE SET
         name=EXCLUDED.name,
         vat_registered=EXCLUDED.vat_registered,
         email=EXCLUDED.email,
         phone=EXCLUDED.phone,
         address=EXCLUDED.address,
         source='QuickBooks',
         notes=EXCLUDED.notes,
         status='active',
         source_system='QuickBooks',
         source_ref=EXCLUDED.source_ref,
         source_imported_at=EXCLUDED.source_imported_at,
         updated_at=EXCLUDED.updated_at`,
      [
        id,
        COMPANY_ID,
        `QB-CUST-${ref}`,
        row.name,
        row.Taxable === 'Y' ? 1 : 0,
        row.Email || null,
        row['Phone 1'] || null,
        address,
        `Imported from QuickBooks IIF · Original reference ${ref}`,
        ref,
        IMPORTED_AT,
      ],
    );

    await provenance(client, {
      entityType: 'customer',
      entityId: id,
      sourceRecordType: 'CUST',
      sourceRef: ref,
      snapshot: row,
    });
  }

  for (const row of vendors) {
    const ref = row['Reference number'];
    const id = `qb-supplier-${ref}`;
    const address = [1, 2, 3, 4, 5]
      .map((index) => row[`Address ${index}`])
      .filter((value) => value && value.toLowerCase() !== row.name.toLowerCase())
      .join(', ') || null;

    await client.query(
      `INSERT INTO suppliers
        (id,company_id,code,name,vat_registered,credit_terms_days,email,phone,address,fax,source_system,source_ref,source_imported_at,status,created_at,updated_at)
       VALUES ($1,$2,$3,$4,0,0,$5,$6,$7,$8,'QuickBooks',$9,$10,'active',$10,$10)
       ON CONFLICT (company_id,code) DO UPDATE SET
         name=EXCLUDED.name,
         email=EXCLUDED.email,
         phone=EXCLUDED.phone,
         address=EXCLUDED.address,
         fax=EXCLUDED.fax,
         source_system='QuickBooks',
         source_ref=EXCLUDED.source_ref,
         source_imported_at=EXCLUDED.source_imported_at,
         status='active',
         updated_at=EXCLUDED.updated_at`,
      [
        id,
        COMPANY_ID,
        `QB-VEND-${ref}`,
        row.name,
        row.Email || null,
        row['Phone 1'] || null,
        address,
        row.Fax || null,
        ref,
        IMPORTED_AT,
      ],
    );

    await provenance(client, {
      entityType: 'supplier',
      entityId: id,
      sourceRecordType: 'VEND',
      sourceRef: ref,
      snapshot: row,
    });
  }

  for (const row of items) {
    const id = `qb-item-${row.Ref}`;
    await client.query(
      `INSERT INTO catalog_items
        (id,company_id,name,item_type,income_account_name,description,price_text,cost_text,taxable,tax_code,tax_vendor,preferred_vendor,source_system,source_ref,source_imported_at,active,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'QuickBooks',$13,$14,$15,$14,$14)
       ON CONFLICT (company_id,source_system,source_ref) DO UPDATE SET
         name=EXCLUDED.name,
         item_type=EXCLUDED.item_type,
         income_account_name=EXCLUDED.income_account_name,
         description=EXCLUDED.description,
         price_text=EXCLUDED.price_text,
         cost_text=EXCLUDED.cost_text,
         taxable=EXCLUDED.taxable,
         tax_code=EXCLUDED.tax_code,
         tax_vendor=EXCLUDED.tax_vendor,
         preferred_vendor=EXCLUDED.preferred_vendor,
         source_imported_at=EXCLUDED.source_imported_at,
         active=EXCLUDED.active,
         updated_at=EXCLUDED.updated_at`,
      [
        id,
        COMPANY_ID,
        row['Item / service'],
        row.Type,
        row.Account || null,
        row.Description || null,
        row.Price || null,
        row.Cost || null,
        row.Taxable === 'Y' ? 1 : 0,
        row['Tax code'] || null,
        row['Tax vendor'] || null,
        row['Preferred vendor'] || null,
        row.Ref,
        IMPORTED_AT,
        row.Hidden === 'Y' ? 0 : 1,
      ],
    );

    await provenance(client, {
      entityType: 'catalog_item',
      entityId: id,
      sourceRecordType: 'INVITEM',
      sourceRef: row.Ref,
      snapshot: row,
    });
  }

  const recordTypeByCategory = {
    customer_type: 'CTYPE',
    job_type: 'JOBTYPE',
    vendor_type: 'VTYPE',
    payment_method: 'PAYMETH',
    shipping_method: 'SHIPMETH',
    invoice_memo: 'INVMEMO',
    payment_term: 'TERMS',
    sales_tax_code: 'SALESTAXCODE',
    custom_item_dictionary: 'CUSTOM_ITEM_DICTIONARY',
    custom_name_dictionary: 'CUSTOM_NAME_DICTIONARY',
  };

  for (const row of references) {
    const id = `qb-ref-${row.category}-${row.ref}`;
    await client.query(
      `INSERT INTO legacy_reference_values
        (id,company_id,category,label,source_ref,metadata_json,source_system,imported_at)
       VALUES ($1,$2,$3,$4,$5,$6,'QuickBooks',$7)
       ON CONFLICT (company_id,category,source_ref) DO UPDATE SET
         label=EXCLUDED.label,
         metadata_json=EXCLUDED.metadata_json,
         imported_at=EXCLUDED.imported_at`,
      [
        id,
        COMPANY_ID,
        row.category,
        row.label,
        row.ref,
        JSON.stringify(row.raw),
        IMPORTED_AT,
      ],
    );

    await provenance(client, {
      entityType: 'legacy_reference_value',
      entityId: id,
      sourceRecordType: recordTypeByCategory[row.category] ?? row.category,
      sourceRef: row.ref,
      snapshot: row.raw,
    });
  }

  const vat = items.find(
    (row) => row['Item / service'] === 'VAT' && row.Price === '18.0%',
  );
  if (vat) {
    await client.query(
      `INSERT INTO tax_rules
        (id,company_id,name,code,basis_points,effective_at,applicability,inclusive,active,configuration_json,created_at,updated_at)
       VALUES ('qb-tax-vat-16',$1,'VAT','VAT',1800,$2,'sales',0,1,$3,$2,$2)
       ON CONFLICT (company_id,code,effective_at) DO UPDATE SET
         basis_points=EXCLUDED.basis_points,
         configuration_json=EXCLUDED.configuration_json,
         updated_at=EXCLUDED.updated_at`,
      [COMPANY_ID, IMPORTED_AT, JSON.stringify({ source: 'QuickBooks', sourceRef: vat.Ref, raw: vat })],
    );
  }

  await client.query('COMMIT');

  console.log('[Star Africa] QuickBooks master-data import complete.');
  console.log(`[Star Africa] Accounts: ${accounts.length}, items/services: ${items.length}, customers: ${customers.length}, vendors: ${vendors.length}, reference rows: ${references.length}.`);
  console.log('[Star Africa] Source transaction blocks present: no.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
