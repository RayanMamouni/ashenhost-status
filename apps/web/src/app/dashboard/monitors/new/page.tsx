'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/DashboardNav';
import { ArrowLeft, Save, Activity } from 'lucide-react';
import Link from 'next/link';

export default function NewMonitorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'http',
    intervalSeconds: 60,
    timeoutSeconds: 10,
    port: 80,
    dnsRecordType: 'A',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create monitor');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-4xl">
        <div className="pb-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-2 border border-border bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-heading font-bold tracking-wider">
                [PROVISION] NEW_MONITOR
              </h1>
              <p className="text-xs font-mono text-text-muted mt-0.5">
                CONFIGURE TARGET ENDPOINT & POLLING INTERVALS
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="my-6 p-4 border border-status-down bg-[#2B0E0E] text-status-down text-xs font-mono rounded-xs">
            [ERROR]: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="bg-surface border border-border p-6 rounded-xs space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                MONITOR_NAME *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Primary Production API"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-background border border-border text-text-primary font-mono text-xs rounded-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                  PROTOCOL_TYPE
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-text-primary font-mono text-xs rounded-xs focus:outline-none focus:border-accent"
                >
                  <option value="http">HTTP / HTTPS Healthcheck</option>
                  <option value="tcp_port">TCP Port Ping</option>
                  <option value="ssl_cert">SSL Certificate Expiry</option>
                  <option value="dns">DNS Resolution Check</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                  TARGET_URL_OR_HOST *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    formData.type === 'http'
                      ? 'https://api.domain.com/healthz'
                      : formData.type === 'dns'
                      ? 'domain.com'
                      : 'api.domain.com'
                  }
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-text-primary font-mono text-xs rounded-xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {formData.type === 'tcp_port' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                  TARGET_PORT
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-text-primary font-mono text-xs rounded-xs focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {formData.type === 'dns' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                  DNS_RECORD_TYPE
                </label>
                <select
                  value={formData.dnsRecordType}
                  onChange={(e) => setFormData({ ...formData, dnsRecordType: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-text-primary font-mono text-xs rounded-xs focus:outline-none focus:border-accent"
                >
                  <option value="A">A (IPv4)</option>
                  <option value="AAAA">AAAA (IPv6)</option>
                  <option value="CNAME">CNAME</option>
                  <option value="MX">MX</option>
                  <option value="TXT">TXT</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-border">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                  CHECK_INTERVAL
                </label>
                <select
                  value={formData.intervalSeconds}
                  onChange={(e) => setFormData({ ...formData, intervalSeconds: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-text-primary font-mono text-xs rounded-xs focus:outline-none focus:border-accent"
                >
                  <option value={30}>30 Seconds (Ultra-Fast)</option>
                  <option value={60}>60 Seconds (Standard)</option>
                  <option value={300}>5 Minutes</option>
                  <option value={600}>10 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-muted mb-2">
                  TIMEOUT_LIMIT
                </label>
                <select
                  value={formData.timeoutSeconds}
                  onChange={(e) => setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-text-primary font-mono text-xs rounded-xs focus:outline-none focus:border-accent"
                >
                  <option value={5}>5 Seconds</option>
                  <option value={10}>10 Seconds</option>
                  <option value={30}>30 Seconds</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-border rounded-xs bg-surface text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
            >
              DISCARD
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-accent bg-accent hover:bg-accent-hover text-black font-bold rounded-xs text-xs font-mono flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'PROVISIONING...' : 'DEPLOY_MONITOR'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
