'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: string | null;
};

const steps = [
  'Project & contract',
  'Team & budget',
  'Workflow & documents',
  'Review',
];

const categories = [
  'Materials',
  'Labour',
  'Equipment',
  'Transport',
  'Subcontractors',
  'Professional services',
  'Site costs',
  'Administration',
  'Contingency',
  'Other',
];

export function NewProjectForm({
  teamMembers,
}: {
  teamMembers: TeamMember[];
}) {
  const router = useRouter();
  const uniqueMembers = useMemo(
    () =>
      Array.from(
        new Map(teamMembers.map((member) => [member.id, member])).values(),
      ),
    [teamMembers],
  );

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState<Record<string, string>>({
    currency: 'UGX',
    priority: 'medium',
    retentionPercent: '5',
    advancePercent: '0',
    defectsLiabilityMonths: '6',
    projectManagerId: '',
    siteManagerId: '',
  });

  const set = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const input = (
    name: string,
    label: string,
    type = 'text',
    required = false,
  ) => (
    <label>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        type={type}
        value={values[name] ?? ''}
        onChange={(event) => set(name, event.target.value)}
        required={required}
      />
    </label>
  );

  function validateCurrentStep() {
    if (
      step === 0 &&
      (!values.code ||
        !values.name ||
        !values.client ||
        !values.description ||
        !values.location ||
        !values.category ||
        !values.contractValue ||
        !values.startDate ||
        !values.completionDate)
    ) {
      return 'Complete the required project and contract information.';
    }
    if (
      step === 1 &&
      (!values.projectManagerId || !values.siteManagerId)
    ) {
      return 'Assign a project manager and site manager.';
    }
    return '';
  }

  function next() {
    const validation = validateCurrentStep();
    setError(validation);
    if (validation) return;
    setStep((current) => Math.min(steps.length - 1, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit() {
    const validation = validateCurrentStep();
    if (validation) {
      setError(validation);
      return;
    }

    setBusy(true);
    setError('');
    try {
      const budget = Object.fromEntries(
        categories.map((category) => [
          category,
          Number(values[`budget_${category}`] || 0),
        ]),
      );

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...values,
          contractValue: Number(values.contractValue),
          retentionPercent: Number(values.retentionPercent),
          advancePercent: Number(values.advancePercent),
          defectsLiabilityMonths: Number(values.defectsLiabilityMonths),
          budget,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        if (result.code === 'PASSWORD_CHANGE_REQUIRED') {
          router.push('/account/security');
          return;
        }
        setError(result.error ?? 'Could not create project.');
        return;
      }

      router.push(`/projects/${result.id}?created=1`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const selectedManager = uniqueMembers.find(
    (member) => member.id === values.projectManagerId,
  );
  const selectedSiteManager = uniqueMembers.find(
    (member) => member.id === values.siteManagerId,
  );
  const budgetTotal = categories.reduce(
    (sum, category) => sum + Number(values[`budget_${category}`] || 0),
    0,
  );

  return (
    <div className="page-content project-form-page">
      <div className="form-page-head">
        <Link href="/projects">
          <ArrowLeft />
          Back to Projects
        </Link>
        <p className="eyebrow">FAST PROJECT SETUP</p>
        <h1>Create a new project</h1>
        <p>
          Four focused steps replace the former seven-step setup. Required
          information is grouped by the decision the user is making.
        </p>
      </div>

      <div className="project-stepper compact">
        {steps.map((item, index) => (
          <button
            key={item}
            className={index === step ? 'active' : index < step ? 'done' : ''}
            onClick={() => index < step && setStep(index)}
            type="button"
          >
            <span>{index < step ? <CheckCircle2 /> : index + 1}</span>
            <strong>{item}</strong>
          </button>
        ))}
      </div>

      <section className="panel project-form-card">
        {step === 0 ? (
          <>
            <div className="form-section">
              <header>
                <span>01</span>
                <div>
                  <h2>Project identity</h2>
                  <p>Capture the awarded work once, using the real client and contract reference.</p>
                </div>
              </header>
              <div className="form-grid">
                {input('code', 'Project code', 'text', true)}
                {input('name', 'Project name', 'text', true)}
                {input('client', 'Client', 'text', true)}
                <label>
                  <span>Project category *</span>
                  <select
                    value={values.category ?? ''}
                    onChange={(event) => set('category', event.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    <option>Construction</option>
                    <option>Laboratory equipment</option>
                    <option>Medical supplies</option>
                    <option>Furniture</option>
                    <option>Professional services</option>
                    <option>General supply</option>
                  </select>
                </label>
                <label className="wide">
                  <span>Description *</span>
                  <textarea
                    value={values.description ?? ''}
                    onChange={(event) => set('description', event.target.value)}
                    rows={4}
                    required
                  />
                </label>
                {input('location', 'Location', 'text', true)}
                {input('bidId', 'Tender / bid reference')}
                {input('contractReference', 'Contract reference')}
                {input('purchaseOrderReference', 'Purchase order / reference')}
                <label>
                  <span>Priority</span>
                  <select
                    value={values.priority}
                    onChange={(event) => set('priority', event.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="form-section section-divider">
              <header>
                <span>02</span>
                <div>
                  <h2>Contract terms</h2>
                  <p>Keep financial value, schedule and retention terms together.</p>
                </div>
              </header>
              <div className="form-grid">
                {input('contractValue', 'Contract value', 'number', true)}
                <label>
                  <span>Currency</span>
                  <select
                    value={values.currency}
                    onChange={(event) => set('currency', event.target.value)}
                  >
                    <option>UGX</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </label>
                {input('startDate', 'Start date', 'date', true)}
                {input('completionDate', 'Expected completion', 'date', true)}
                {input(
                  'defectsLiabilityMonths',
                  'Defects liability period (months)',
                  'number',
                )}
                {input('retentionPercent', 'Retention %', 'number')}
                {input('advancePercent', 'Advance payment %', 'number')}
                {input('performanceSecurity', 'Performance security')}
                {input('insuranceRequirements', 'Insurance requirements')}
              </div>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="form-section">
              <header>
                <span>03</span>
                <div>
                  <h2>Accountable delivery team</h2>
                  <p>
                    Select real production users. Shared demonstration identities
                    are not available.
                  </p>
                </div>
              </header>
              <div className="form-grid">
                <label>
                  <span>Project manager *</span>
                  <select
                    value={values.projectManagerId}
                    onChange={(event) =>
                      set('projectManagerId', event.target.value)
                    }
                    required
                  >
                    <option value="">Select an authorised user</option>
                    {uniqueMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {member.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Site manager *</span>
                  <select
                    value={values.siteManagerId}
                    onChange={(event) =>
                      set('siteManagerId', event.target.value)
                    }
                    required
                  >
                    <option value="">Select an authorised user</option>
                    {uniqueMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {member.role}
                      </option>
                    ))}
                  </select>
                </label>
                {input('financeContact', 'Finance contact')}
                {input('procurementContact', 'Procurement contact')}
                {input('technicalLead', 'Technical lead')}
              </div>
            </div>

            <div className="form-section section-divider">
              <header>
                <span>04</span>
                <div>
                  <h2>Initial budget</h2>
                  <p>Enter only the categories available at setup; they remain editable with audit history.</p>
                </div>
              </header>
              <div className="budget-entry-grid">
                {categories.map((category) => (
                  <label key={category}>
                    <span>{category}</span>
                    <input
                      type="number"
                      min="0"
                      value={values[`budget_${category}`] ?? ''}
                      onChange={(event) =>
                        set(`budget_${category}`, event.target.value)
                      }
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="form-section">
              <header>
                <span>05</span>
                <div>
                  <h2>Delivery workflow</h2>
                  <p>
                    The standard lifecycle is applied automatically, reducing
                    setup decisions while keeping progress structured.
                  </p>
                </div>
              </header>
              <div className="workflow-selection">
                {[
                  'Awarded',
                  'Contract Setup',
                  'Site Handover',
                  'Mobilization',
                  'Materials Procurement',
                  'Work Started',
                  'In Progress',
                  'Testing',
                  'Practical Completion',
                  'Retention Period',
                  'Completed',
                  'Closed',
                ].map((item, index) => (
                  <div key={item}>
                    <span>{index + 1}</span>
                    <strong>{item}</strong>
                    <CheckCircle2 />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section section-divider">
              <header>
                <span>06</span>
                <div>
                  <h2>Initial evidence</h2>
                  <p>
                    Create the project first, then upload contracts, BOQs,
                    drawings and handover evidence from its document workspace.
                  </p>
                </div>
              </header>
              <div className="document-drop">
                <FileText />
                <h3>Documents continue after project creation</h3>
                <p>
                  This avoids making users upload the same file more than once
                  before a project ID exists.
                </p>
              </div>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <div className="form-section review-section">
            <header>
              <span>07</span>
              <div>
                <h2>Review and create</h2>
                <p>Confirm the key accountable record before saving.</p>
              </div>
            </header>
            <dl>
              <div>
                <dt>Project</dt>
                <dd>{values.code} · {values.name}</dd>
              </div>
              <div>
                <dt>Client</dt>
                <dd>{values.client}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{values.location}</dd>
              </div>
              <div>
                <dt>Contract</dt>
                <dd>
                  {values.currency}{' '}
                  {Number(values.contractValue || 0).toLocaleString('en-UG')}
                </dd>
              </div>
              <div>
                <dt>Schedule</dt>
                <dd>{values.startDate} → {values.completionDate}</dd>
              </div>
              <div>
                <dt>Project manager</dt>
                <dd>{selectedManager?.name || 'Not selected'}</dd>
              </div>
              <div>
                <dt>Site manager</dt>
                <dd>{selectedSiteManager?.name || 'Not selected'}</dd>
              </div>
              <div>
                <dt>Initial budget</dt>
                <dd>
                  {values.currency} {budgetTotal.toLocaleString('en-UG')}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {error ? (
          <p className="form-error" role="alert" aria-live="polite">
            {error}
          </p>
        ) : null}

        <footer>
          <Button
            variant="outline"
            disabled={step === 0 || busy}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            <ArrowLeft />
            Previous
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next}>
              Continue
              <ArrowRight />
            </Button>
          ) : (
            <Button onClick={submit} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="spin" />
                  Creating project…
                </>
              ) : (
                <>
                  Create project
                  <CheckCircle2 />
                </>
              )}
            </Button>
          )}
        </footer>
      </section>
    </div>
  );
}
