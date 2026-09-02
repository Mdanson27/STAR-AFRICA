'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { StarAfricaLogo } from './star-africa-logo';
import { Button } from './ui/button';
import { DEMO_PASSWORD, demoAccounts } from '@/lib/security/demo-accounts';

const featuredRoles = [
  'DIRECTOR',
  'BIDS & TENDERS OFFICER',
  'FINANCE ADMIN',
  'PROJECT MANAGER',
  'AUDITOR / VIEWER',
  'SUPER ADMIN',
] as const;
const labels: Record<string, string> = {
  'BIDS & TENDERS OFFICER': 'Bids Officer',
  'FINANCE ADMIN': 'Finance',
  'AUDITOR / VIEWER': 'Auditor',
  'SUPER ADMIN': 'Super Admin',
  DIRECTOR: 'Director',
  'PROJECT MANAGER': 'Project Manager',
};

export function LoginExperience({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('director@starafrica.demo');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? 'Unable to sign in.');
      setBusy(false);
      return;
    }
    router.push(returnTo);
    router.refresh();
  }

  function selectRole(role: string) {
    const account = demoAccounts.find((item) => item.role === role);
    if (!account) return;
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setError('');
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-logo-panel">
          <StarAfricaLogo size="medium" />
        </div>
        <div>
          <p>STAR AFRICA OS</p>
          <h1>Business Operations &amp; Financial Management</h1>
          <span>
            One accountable workspace for opportunity discovery, compliant
            tender preparation, financial control, approvals and award.
          </span>
        </div>
        <ul>
          <li>
            <ShieldCheck /> Server-enforced role permissions
          </li>
          <li>
            <LockKeyhole /> Auditable decisions and records
          </li>
        </ul>
      </section>
      <section className="login-form-panel">
        <div className="login-card">
          <p className="eyebrow">SECURE DEMO WORKSPACE</p>
          <h2>Welcome back</h2>
          <p>
            Sign in with a documented demonstration account. These credentials
            contain no real employee data.
          </p>
          <form className="login-form" onSubmit={signIn}>
            <label>
              <span>Email</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Password</span>
              <span className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            <label className="remember-field">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Remember me for 7 days</span>
            </label>
            {error ? (
              <p className="login-error" role="alert">
                {error}
              </p>
            ) : null}
            <Button size="lg" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'} {!busy ? <ArrowRight /> : null}
            </Button>
          </form>
          <div className="demo-access">
            <div>
              <strong>Demo access</strong>
              <span>Select a role to populate its credentials</span>
            </div>
            <div className="demo-role-grid">
              {featuredRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={
                    demoAccounts.find((item) => item.role === role)?.email ===
                    email
                      ? 'selected'
                      : ''
                  }
                >
                  <CheckCircle2 />
                  <span>{labels[role]}</span>
                </button>
              ))}
            </div>
            <small>
              Development/demo only · shared password:{' '}
              <code>{DEMO_PASSWORD}</code>
            </small>
          </div>
        </div>
      </section>
    </main>
  );
}
