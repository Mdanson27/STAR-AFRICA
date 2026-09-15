'use client';
/* eslint-disable jsx-a11y/label-has-associated-control */
import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
const initial = {
  customerType: 'Company',
  name: '',
  tradingName: '',
  code: '',
  category: 'Other',
  industry: '',
  status: 'active',
  tin: '',
  vatRegistered: false,
  registrationNumber: '',
  website: '',
  phone: '',
  secondaryPhone: '',
  email: '',
  correspondenceEmail: '',
  country: 'Uganda',
  district: '',
  city: '',
  address: '',
  postalAddress: '',
  billingContact: '',
  billingEmail: '',
  preferredCurrency: 'UGX',
  paymentTerms: '30 days',
  dueDays: '30',
  retentionApplicable: false,
  retentionPercent: '0',
  creditLimit: '0',
  accountManagerId: '',
  source: '',
  firstEngagementAt: '',
  notes: '',
  tags: '',
};
export function CustomerForm({
  managers,
}: {
  managers: Array<{ id: string; display_name: string }>;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState<{
    id: string;
    code: string;
    name: string;
  } | null>(null);
  const field = (key: keyof typeof initial, value: string | boolean) =>
    setForm({ ...form, [key]: value });
  const save = async (override = false) => {
    setBusy(true);
    setError('');
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        dueDays: Number(form.dueDays),
        retentionPercent: Number(form.retentionPercent),
        allowDuplicate: override,
      }),
    });
    const body = (await response.json()) as {
      id?: string;
      error?: string;
      duplicate?: { id: string; code: string; name: string };
    };
    setBusy(false);
    if (response.status === 409 && body.duplicate) {
      setDuplicate(body.duplicate);
      setError(body.error ?? 'Possible duplicate');
      return;
    }
    if (!response.ok || !body.id) {
      setError(body.error ?? 'Customer could not be saved.');
      return;
    }
    window.location.assign(`/customers/${body.id}`);
  };
  return (
    <main className="page-content customer-form-page">
      <header>
        <Link href="/customers">
          <ArrowLeft />
          Back to customers
        </Link>
        <div>
          <span>
            <Building2 />
          </span>
          <p className="eyebrow">New commercial relationship</p>
          <h1>Create customer</h1>
          <p>
            Set up the organization, billing defaults, relationship owner, and
            contact channels.
          </p>
        </div>
      </header>
      <section className="panel customer-form-card">
        <FormSection title="Customer information">
          <Select
            label="Customer type"
            value={form.customerType}
            change={(v) => field('customerType', v)}
            options={[
              'Company',
              'Government Entity',
              'NGO',
              'Institution',
              'Individual',
              'Other',
            ]}
          />
          <Text
            label="Legal / organization name *"
            value={form.name}
            change={(v) => field('name', v)}
          />
          <Text
            label="Trading name"
            value={form.tradingName}
            change={(v) => field('tradingName', v)}
          />
          <Text
            label="Customer code"
            placeholder="Auto-generated"
            value={form.code}
            change={(v) => field('code', v)}
          />
          <Select
            label="Category"
            value={form.category}
            change={(v) => field('category', v)}
            options={[
              'Government',
              'NGO',
              'Private Company',
              'Hospital/Medical',
              'Education',
              'Local Government',
              'International Organisation',
              'Other',
            ]}
          />
          <Text
            label="Industry / sector"
            value={form.industry}
            change={(v) => field('industry', v)}
          />
          <Select
            label="Status"
            value={form.status}
            change={(v) => field('status', v)}
            options={['active', 'inactive', 'on_hold']}
          />
          <Text label="TIN" value={form.tin} change={(v) => field('tin', v)} />
          <Text
            label="Registration number"
            value={form.registrationNumber}
            change={(v) => field('registrationNumber', v)}
          />
          <Text
            label="Website"
            type="url"
            value={form.website}
            change={(v) => field('website', v)}
          />
          <CheckField
            label="VAT registered"
            checked={form.vatRegistered}
            change={(v) => field('vatRegistered', v)}
          />
        </FormSection>
        <FormSection title="Contact & address">
          <Text
            label="Main phone"
            value={form.phone}
            change={(v) => field('phone', v)}
          />
          <Text
            label="Secondary phone"
            value={form.secondaryPhone}
            change={(v) => field('secondaryPhone', v)}
          />
          <Text
            label="Main email"
            type="email"
            value={form.email}
            change={(v) => field('email', v)}
          />
          <Text
            label="Correspondence email"
            type="email"
            value={form.correspondenceEmail}
            change={(v) => field('correspondenceEmail', v)}
          />
          <Text
            label="Country"
            value={form.country}
            change={(v) => field('country', v)}
          />
          <Text
            label="District / region"
            value={form.district}
            change={(v) => field('district', v)}
          />
          <Text
            label="City / town"
            value={form.city}
            change={(v) => field('city', v)}
          />
          <Text
            label="Physical address"
            value={form.address}
            change={(v) => field('address', v)}
          />
          <Text
            label="Postal address / PO Box"
            value={form.postalAddress}
            change={(v) => field('postalAddress', v)}
          />
        </FormSection>
        <FormSection title="Billing & commercial">
          <Text
            label="Billing contact"
            value={form.billingContact}
            change={(v) => field('billingContact', v)}
          />
          <Text
            label="Billing email"
            type="email"
            value={form.billingEmail}
            change={(v) => field('billingEmail', v)}
          />
          <Select
            label="Preferred currency"
            value={form.preferredCurrency}
            change={(v) => field('preferredCurrency', v)}
            options={['UGX', 'USD', 'EUR', 'KES']}
          />
          <Select
            label="Payment terms"
            value={form.paymentTerms}
            change={(v) => field('paymentTerms', v)}
            options={[
              'Due on receipt',
              '7 days',
              '14 days',
              '30 days',
              '45 days',
              '60 days',
              'Custom',
            ]}
          />
          <Text
            label="Default due days"
            type="number"
            value={form.dueDays}
            change={(v) => field('dueDays', v)}
          />
          <CheckField
            label="Retention normally applicable"
            checked={form.retentionApplicable}
            change={(v) => field('retentionApplicable', v)}
          />
          <Text
            label="Default retention %"
            type="number"
            value={form.retentionPercent}
            change={(v) => field('retentionPercent', v)}
          />
          <Text
            label="Credit limit"
            type="number"
            value={form.creditLimit}
            change={(v) => field('creditLimit', v)}
          />
          <label>
            <span>Account manager</span>
            <NativeSelect
              aria-label="Account manager"
              value={form.accountManagerId}
              onChange={(e) => field('accountManagerId', e.target.value)}
            >
              <option value="">Not assigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <Text
            label="Source"
            value={form.source}
            change={(v) => field('source', v)}
          />
          <Text
            label="First engagement"
            type="date"
            value={form.firstEngagementAt}
            change={(v) => field('firstEngagementAt', v)}
          />
          <Text
            label="Tags"
            value={form.tags}
            change={(v) => field('tags', v)}
          />
          <label className="wide">
            <span>Internal notes</span>
            <Textarea
              aria-label="Internal notes"
              value={form.notes}
              onChange={(e) => field('notes', e.target.value)}
            />
          </label>
        </FormSection>
        {error ? (
          <div className="form-error" role="alert">
            <AlertTriangle />
            {error}
            {duplicate ? (
              <span>
                <Link href={`/customers/${duplicate.id}`}>
                  View {duplicate.code}
                </Link>
                <button onClick={() => save(true)}>Create anyway</button>
              </span>
            ) : null}
          </div>
        ) : null}
        <footer>
          <Button variant="outline" render={<Link href="/customers" />}>
            Cancel
          </Button>
          <Button disabled={busy || !form.name.trim()} onClick={() => save()}>
            <Check />
            {busy ? 'Saving…' : 'Create customer'}
          </Button>
        </footer>
      </section>
    </main>
  );
}
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="customer-form-section">
      <legend>{title}</legend>
      <div>{children}</div>
    </fieldset>
  );
}
function Text({
  label,
  value,
  change,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <Input
        aria-label={label}
        type={type}
        min={type === 'number' ? '0' : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => change(e.target.value)}
      />
    </label>
  );
}
function Select({
  label,
  value,
  change,
  options,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span>{label}</span>
      <NativeSelect
        aria-label={label}
        value={value}
        onChange={(e) => change(e.target.value)}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </NativeSelect>
    </label>
  );
}
function CheckField({
  label,
  checked,
  change,
}: {
  label: string;
  checked: boolean;
  change: (v: boolean) => void;
}) {
  return (
    <label className="check">
      <input
        aria-label={label}
        type="checkbox"
        checked={checked}
        onChange={(e) => change(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
