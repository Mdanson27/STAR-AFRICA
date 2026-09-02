import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { StarAfricaLogo } from '@/components/star-africa-logo';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return <main className="login-page">
    <section className="login-brand-panel">
      <StarAfricaLogo size="large" />
      <div><p>STAR AFRICA OS</p><h1>Business Operations &amp; Financial Management</h1><span>One accountable workspace for bids, delivery, finance, procurement, people, and reporting.</span></div>
      <ul><li><ShieldCheck /> Permission-controlled workflows</li><li><LockKeyhole /> Auditable financial records</li></ul>
    </section>
    <section className="login-form-panel"><div className="login-card"><p className="eyebrow">SECURE WORKSPACE</p><h2>Sign in to Star Africa OS</h2><p>Use your authorised workspace identity. Passwords are never stored by this application.</p><Link className={buttonVariants({ size: 'lg' })} href="/signin-with-chatgpt?return_to=%2F">Continue securely <ArrowRight /></Link><small>Access is governed by Star Africa role and approval policies.</small></div></section>
  </main>;
}
