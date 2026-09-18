'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { StarAfricaLogo } from './star-africa-logo';
import { Button } from './ui/button';

export function LoginExperience({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        landingPath?: string;
      };

      if (!response.ok) {
        setError(result.error ?? 'Unable to sign in.');
        return;
      }

      router.push(result.landingPath ?? returnTo);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-logo-panel">
          <StarAfricaLogo size="medium" />
        </div>
        <div>
          <p>STAR AFRICA OS · PRODUCTION V1</p>
          <h1>Secure Business Operations &amp; Financial Management</h1>
          <span>
            One controlled workspace for bids, projects, customers, finance,
            documents, procurement and management reporting.
          </span>
        </div>
        <ul>
          <li>
            <ShieldCheck /> Role-based access and protected records
          </li>
          <li>
            <LockKeyhole /> Server-side sessions and account lockout protection
          </li>
          <li>
            <Activity /> Security events and auditable system activity
          </li>
        </ul>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <p className="eyebrow">SECURE SIGN IN</p>
          <h2>Welcome back</h2>
          <p>
            Use your authorised Star Africa account. Sign-in attempts and
            security-sensitive actions are monitored.
          </p>

          <form className="login-form" onSubmit={signIn}>
            <label>
              <span>Email address</span>
              <input
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                required
                autoFocus
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
                  placeholder="Enter your password"
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
              <span>Keep me signed in on this trusted device for 7 days</span>
            </label>

            {error ? (
              <p className="login-error" role="alert" aria-live="polite">
                {error}
              </p>
            ) : null}

            <Button size="lg" type="submit" disabled={busy}>
              {busy ? 'Signing in securely…' : 'Sign in'}
              {!busy ? <ArrowRight /> : null}
            </Button>
          </form>

          <div className="production-login-note">
            <ShieldCheck />
            <div>
              <strong>Production access</strong>
              <span>
                Accounts are individually assigned. Shared demonstration
                credentials are disabled.
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
