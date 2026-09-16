'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xs p-8 space-y-6">
        {/* Brand */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center space-x-2 text-accent font-mono text-sm tracking-widest font-bold">
            <Terminal className="w-5 h-5 text-accent" />
            <span>ASHENHOST // OS</span>
          </div>
          <h1 className="text-xl font-heading font-bold tracking-wider">[AUTH] OPERATOR_SIGN_IN</h1>
          <p className="text-xs font-mono text-text-muted">AUTHENTICATE TO ACCESS TELEMETRY GRID</p>
        </div>

        {error && (
          <div className="p-3 border border-status-down bg-[#2B0E0E] text-status-down text-xs font-mono rounded-xs">
            [ACCESS_DENIED]: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
              OPERATOR_EMAIL
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="admin@ashenhost.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
              SECURITY_KEY (PASSWORD)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 border border-accent bg-accent hover:bg-accent-hover text-black font-bold text-xs font-mono rounded-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'CLIENT_LOGIN'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-4 border-t border-border text-center text-xs font-mono text-text-muted">
          Need a tenant organization?{' '}
          <Link href="/register" className="text-accent hover:underline">
            PROVISION_TENANT
          </Link>
        </div>
      </div>
    </div>
  );
}
