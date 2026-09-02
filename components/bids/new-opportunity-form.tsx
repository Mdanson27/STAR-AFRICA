'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  Landmark,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';

export function NewOpportunityForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch('/api/bids', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as {
      id?: string;
      error?: string;
      duplicate?: { reference: string };
    };
    if (!response.ok) {
      setError(
        result.duplicate
          ? `Possible duplicate: ${result.duplicate.reference}. Review the existing opportunity before creating another.`
          : (result.error ?? 'Unable to save the opportunity.'),
      );
      setBusy(false);
      return;
    }
    router.push(`/bids/${result.id}?created=1`);
    router.refresh();
  }
  return (
    <div className="page-content opportunity-form-page">
      <div className="form-page-head">
        <div>
          <Link href="/bids">
            <ArrowLeft /> Back to bids
          </Link>
          <p className="eyebrow">NEW OPPORTUNITY</p>
          <h1>Register a tender opportunity</h1>
          <span>
            Capture the information needed for qualification, ownership and
            deadline control.
          </span>
        </div>
        <div>
          <Link className={buttonVariants({ variant: 'outline' })} href="/bids">
            Cancel
          </Link>
          <Button form="opportunity-form" type="submit" disabled={busy}>
            <Save />
            {busy ? 'Saving…' : 'Save opportunity'}
          </Button>
        </div>
      </div>
      <form
        id="opportunity-form"
        className="opportunity-form"
        onSubmit={submit}
      >
        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}
        <FormSection
          icon={<FileText />}
          number="01"
          title="Basic information"
          description="Identify the opportunity and its procuring entity."
        >
          <div className="form-grid">
            <Field
              label="Tender / reference number"
              name="reference"
              required
              placeholder="e.g. MOH/SUPLS/26/114"
            />
            <Field label="Tender title" name="title" required wide />
            <Field
              label="Organisation / procuring entity"
              name="organization"
              required
            />
            <Field
              label="Category"
              name="category"
              required
              select={[
                'Construction',
                'Laboratory equipment',
                'Medical supplies',
                'Furniture',
                'General supply',
                'Consultancy',
              ]}
            />
            <Field label="Subcategory" name="subcategory" />
            <Field label="Location" name="location" />
            <Field
              label="Source"
              name="source"
              select={['Manual', 'CSV Import', 'Demo Provider']}
            />
            <Field label="Source URL" name="sourceUrl" type="url" />
            <Field
              label="Procurement method"
              name="procurementMethod"
              select={[
                'Open domestic bidding',
                'Open international bidding',
                'Request for proposal',
                'Request for quotations',
                'Restricted bidding',
              ]}
            />
            <Field label="Description" name="description" textarea wide />
          </div>
        </FormSection>
        <FormSection
          icon={<CalendarDays />}
          number="02"
          title="Important dates"
          description="All times are interpreted in Africa/Kampala."
        >
          <div className="form-grid">
            <Field
              label="Publication date"
              name="publicationDate"
              type="date"
            />
            <Field
              label="Clarification deadline"
              name="clarificationDeadline"
              type="datetime-local"
            />
            <Field
              label="Pre-bid meeting"
              name="preBidMeetingDate"
              type="datetime-local"
            />
            <Field
              label="Site visit"
              name="siteVisitDate"
              type="datetime-local"
            />
            <Field
              label="Submission deadline"
              name="deadline"
              type="datetime-local"
              required
            />
            <Field
              label="Expected award date"
              name="expectedAwardDate"
              type="date"
            />
          </div>
        </FormSection>
        <FormSection
          icon={<Landmark />}
          number="03"
          title="Financial information"
          description="Contract value is separate from the internal bid preparation budget."
        >
          <div className="form-grid">
            <Field
              label="Estimated contract value"
              name="estimatedValue"
              type="number"
              required
            />
            <Field
              label="Currency"
              name="currency"
              select={['UGX', 'USD', 'EUR', 'KES']}
            />
            <Field label="Tender document fee" name="tenderFee" type="number" />
            <Field
              label="Bid security required?"
              name="securityRequired"
              select={['No', 'Yes']}
            />
            <Field
              label="Bid security amount"
              name="securityAmount"
              type="number"
            />
            <Field
              label="Bid security %"
              name="securityPercent"
              type="number"
            />
            <Field
              label="Bid validity (days)"
              name="bidValidityDays"
              type="number"
            />
            <Field
              label="Performance security requirement"
              name="performanceSecurity"
            />
          </div>
        </FormSection>
        <FormSection
          icon={<ShieldCheck />}
          number="04"
          title="Eligibility"
          description="Record the conditions used during go / no-go qualification."
        >
          <div className="form-grid">
            <Field
              label="Eligibility notes"
              name="eligibilityNotes"
              textarea
              wide
            />
            <Field
              label="Mandatory qualifications"
              name="mandatoryQualifications"
              textarea
            />
            <Field
              label="Experience requirements"
              name="experienceRequirements"
              textarea
            />
            <Field label="Turnover requirements" name="turnoverRequirements" />
            <Field label="Licences / certifications" name="certifications" />
            <Field
              label="Joint venture allowed?"
              name="jointVentureAllowed"
              select={['No', 'Yes', 'Not stated']}
            />
            <Field
              label="Consortium allowed?"
              name="consortiumAllowed"
              select={['No', 'Yes', 'Not stated']}
            />
          </div>
        </FormSection>
        <FormSection
          icon={<UserRound />}
          number="05"
          title="Ownership"
          description="Assign accountability and reporting context."
        >
          <div className="form-grid">
            <Field
              label="Bid officer"
              name="owner"
              select={['Irene Adoch', 'Amina Nsubuga']}
            />
            <Field
              label="Department"
              name="department"
              select={['Bids & Tenders', 'Projects', 'Procurement', 'Finance']}
            />
            <Field
              label="Priority"
              name="priority"
              select={['Medium', 'Critical', 'High', 'Low']}
            />
            <Field
              label="Reviewers"
              name="reviewers"
              placeholder="Finance, Technical Lead, Director"
            />
            <Field
              label="Tags"
              name="tags"
              placeholder="health, equipment, framework"
              wide
            />
          </div>
        </FormSection>
        <section className="form-section upload-later">
          <div className="form-section-title">
            <span>
              <FileText />
            </span>
            <div>
              <em>06</em>
              <h2>Documents</h2>
              <p>
                Document uploads become available after the opportunity has an
                audit identity.
              </p>
            </div>
          </div>
          <div>
            <Check />
            <span>
              Save this opportunity, then upload the tender document, TOR, BOQ,
              specifications and addenda from its Documents tab.
            </span>
          </div>
        </section>
        <footer className="form-footer">
          <span>
            Saving creates an audit record and starts the bid at{' '}
            <strong>New</strong>.
          </span>
          <div>
            <Link
              className={buttonVariants({ variant: 'outline' })}
              href="/bids"
            >
              Cancel
            </Link>
            <Button type="submit" disabled={busy}>
              <Save />
              {busy ? 'Saving…' : 'Save opportunity'}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function FormSection({
  icon,
  number,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="form-section-title">
        <span>{icon}</span>
        <div>
          <em>{number}</em>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  select,
  textarea,
  wide,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  select?: string[];
  textarea?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? 'wide' : ''}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {select ? (
        <select name={name} required={required}>
          {select.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : textarea ? (
        <textarea name={name} required={required} placeholder={placeholder} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}
