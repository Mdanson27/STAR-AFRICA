'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccountSecurityForm({
  mustChangePassword,
}: {
  mustChangePassword: boolean;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(result.error ?? 'Unable to change password.');
        return;
      }
      router.replace('/login?passwordChanged=1');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-security-card">
      <header>
        <span><KeyRound /></span>
        <div>
          <p className="eyebrow">ACCOUNT SECURITY</p>
          <h1>{mustChangePassword ? 'Set a new password' : 'Change password'}</h1>
          <p>
            Use a unique password with at least 12 characters, upper and lower
            case letters, a number and a symbol.
          </p>
        </div>
      </header>

      {mustChangePassword ? (
        <div className="security-callout">
          <ShieldCheck />
          <div>
            <strong>Password update required</strong>
            <span>
              Your account was provisioned for Production V1. Change the
              temporary password before continuing.
            </span>
          </div>
        </div>
      ) : null}

      <form onSubmit={submit}>
        <label>
          <span>Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </label>
        <label>
          <span>New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={12}
            required
          />
        </label>
        <label>
          <span>Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={12}
            required
          />
        </label>
        {error ? <p className="login-error" role="alert">{error}</p> : null}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </section>
  );
}
