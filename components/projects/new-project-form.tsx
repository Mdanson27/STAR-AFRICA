'use client';
import { useState } from 'react';
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
const steps = [
  'Basic information',
  'Contract',
  'Team',
  'Budget',
  'Workflow',
  'Documents',
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
export function NewProjectForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState<Record<string, string>>({
    currency: 'UGX',
    priority: 'medium',
    retentionPercent: '5',
    advancePercent: '0',
    defectsLiabilityMonths: '6',
    projectManagerId: 'user-projects',
    siteManagerId: 'user-site',
  });
  const set = (key: string, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const next = () => {
    setError('');
    if (
      step === 0 &&
      (!values.code ||
        !values.name ||
        !values.client ||
        !values.description ||
        !values.location ||
        !values.category)
    ) {
      setError('Complete all required basic information.');
      return;
    }
    if (
      step === 1 &&
      (!values.contractValue || !values.startDate || !values.completionDate)
    ) {
      setError('Complete contract value and dates.');
      return;
    }
    setStep((s) => Math.min(6, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  async function submit() {
    setBusy(true);
    setError('');
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
    const result = (await response.json()) as { id?: string; error?: string };
    if (!response.ok) {
      setError(result.error ?? 'Could not create project.');
      setBusy(false);
      return;
    }
    router.push(`/projects/${result.id}?created=1`);
    router.refresh();
  }
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
        onChange={(e) => set(name, e.target.value)}
        required={required}
      />
    </label>
  );
  return (
    <div className="page-content project-form-page">
      <div className="form-page-head">
        <Link href="/projects">
          <ArrowLeft />
          Back to Projects
        </Link>
        <p className="eyebrow">PROJECT SETUP</p>
        <h1>Create a new project</h1>
        <p>
          Set up the contract, delivery team, budget, workflow and initial
          evidence in one controlled record.
        </p>
      </div>
      <div className="project-stepper">
        {steps.map((item, index) => (
          <button
            key={item}
            className={index === step ? 'active' : index < step ? 'done' : ''}
            onClick={() => index < step && setStep(index)}
          >
            <span>{index < step ? <CheckCircle2 /> : index + 1}</span>
            <strong>{item}</strong>
          </button>
        ))}
      </div>
      <section className="panel project-form-card">
        {step === 0 ? (
          <div className="form-section">
            <header>
              <span>01</span>
              <div>
                <h2>Basic information</h2>
                <p>Identify the awarded work and its commercial source.</p>
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
                  onChange={(e) => set('category', e.target.value)}
                >
                  <option value="">Select category</option>
                  <option>Construction</option>
                  <option>Laboratory equipment</option>
                  <option>Medical supplies</option>
                  <option>Furniture</option>
                  <option>Professional services</option>
                </select>
              </label>
              <label className="wide">
                <span>Description *</span>
                <textarea
                  value={values.description ?? ''}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                />
              </label>
              {input('location', 'Location', 'text', true)}
              {input('bidId', 'Tender / bid reference')}{' '}
              {input('contractReference', 'Contract reference')}
              {input('purchaseOrderReference', 'Purchase order / reference')}
              <label>
                <span>Priority</span>
                <select
                  value={values.priority}
                  onChange={(e) => set('priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="form-section">
            <header>
              <span>02</span>
              <div>
                <h2>Contract</h2>
                <p>
                  Capture the core value, schedule, retention and advance terms.
                </p>
              </div>
            </header>
            <div className="form-grid">
              {input('contractValue', 'Contract value', 'number', true)}
              <label>
                <span>Currency</span>
                <select
                  value={values.currency}
                  onChange={(e) => set('currency', e.target.value)}
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
        ) : null}
        {step === 2 ? (
          <div className="form-section">
            <header>
              <span>03</span>
              <div>
                <h2>Delivery team</h2>
                <p>
                  Assign accountable leads. Position permissions continue to
                  govern what each person can see and change.
                </p>
              </div>
            </header>
            <div className="form-grid">
              <label>
                <span>Project Manager</span>
                <select
                  value={values.projectManagerId}
                  onChange={(e) => set('projectManagerId', e.target.value)}
                >
                  <option value="user-projects">
                    Daniel Okello · Project Manager
                  </option>
                </select>
              </label>
              <label>
                <span>Site Manager</span>
                <select
                  value={values.siteManagerId}
                  onChange={(e) => set('siteManagerId', e.target.value)}
                >
                  <option value="user-site">Moses Kato · Site Manager</option>
                </select>
              </label>
              {input('financeContact', 'Finance contact')}
              {input('procurementContact', 'Procurement contact')}
              {input('technicalLead', 'Technical lead')}
              <label className="wide">
                <span>Other team members</span>
                <textarea
                  value={values.otherMembers ?? ''}
                  onChange={(e) => set('otherMembers', e.target.value)}
                  placeholder="Names and project responsibilities"
                />
              </label>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="form-section">
            <header>
              <span>04</span>
              <div>
                <h2>Initial budget</h2>
                <p>
                  Budget lines are stored separately so commitments, actual
                  spend and revisions remain traceable.
                </p>
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
                    onChange={(e) => set(`budget_${category}`, e.target.value)}
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="form-section">
            <header>
              <span>05</span>
              <div>
                <h2>Workflow</h2>
                <p>
                  The standard lifecycle can be configured by administration in
                  a later phase.
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
        ) : null}
        {step === 5 ? (
          <div className="form-section">
            <header>
              <span>06</span>
              <div>
                <h2>Documents</h2>
                <p>
                  Prepare the initial evidence register. File uploads are linked
                  after the project ID is created.
                </p>
              </div>
            </header>
            <div className="document-drop">
              <FileText />
              <h3>Initial document register</h3>
              <p>
                Contract, award letter, purchase order, BOQ, drawings,
                specifications and site handover documents can be uploaded from
                the project workspace after creation.
              </p>
            </div>
          </div>
        ) : null}
        {step === 6 ? (
          <div className="form-section review-section">
            <header>
              <span>07</span>
              <div>
                <h2>Review and create</h2>
                <p>Check the accountable project record before saving it.</p>
              </div>
            </header>
            <dl>
              <div>
                <dt>Project</dt>
                <dd>
                  {values.code} · {values.name}
                </dd>
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
                  {Number(values.contractValue || 0).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Schedule</dt>
                <dd>
                  {values.startDate} → {values.completionDate}
                </dd>
              </div>
              <div>
                <dt>Retention</dt>
                <dd>{values.retentionPercent}%</dd>
              </div>
              <div>
                <dt>Project Manager</dt>
                <dd>Daniel Okello</dd>
              </div>
              <div>
                <dt>Initial budget</dt>
                <dd>
                  {values.currency}{' '}
                  {categories
                    .reduce(
                      (sum, c) => sum + Number(values[`budget_${c}`] || 0),
                      0,
                    )
                    .toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <footer>
          <Button
            variant="outline"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft />
            Previous
          </Button>
          {step < 6 ? (
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
