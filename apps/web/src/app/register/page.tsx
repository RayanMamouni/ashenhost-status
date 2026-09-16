'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, Shield, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    organizationName: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xs p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center space-x-2 text-accent font-mono text-sm tracking-widest font-bold">
            <Terminal className="w-5 h-5 text-accent" />
            <span>ASHENHOST // OS</span>
          </div>
          <h1 className="text-xl font-heading font-bold tracking-wider">[ONBOARD] PROVISION_TENANT</h1>
          <p className="text-xs font-mono text-text-muted">INITIALIZE NEW MULTI-TENANT MONITORING CLUSTER</p>
        </div>

        {error && (
          <div className="p-3 border border-status-down bg-[#2B0E0E] text-status-down text-xs font-mono rounded-xs">
            [ERROR]: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
              ORGANIZATION_NAME *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Cloud Corp"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
              ADMIN_NAME *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Mercer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
              ADMIN_EMAIL *
            </label>
            <input
              type="email"
              required
              placeholder="alex@acme.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
              PASSWORD *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 border border-accent bg-accent hover:bg-accent-hover text-black font-bold text-xs font-mono rounded-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <span>{loading ? 'PROVISIONING_CLUSTER...' : 'CREATE_TENANT_ORGANIZATION'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-4 border-t border-border text-center text-xs font-mono text-text-muted">
          Already registered?{' '}
          <Link href="/login" className="text-accent hover:underline">
            OPERATOR_LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
