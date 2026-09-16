'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/DashboardNav';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewIncidentPage() {
  const router = useRouter();
  const [monitors, setMonitors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    monitorId: '',
    status: 'investigating',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/monitors')
      .then((res) => res.json())
      .then((data) => setMonitors(data.monitors || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard/incidents');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-3xl">
        <div className="pb-6 border-b border-border flex items-center space-x-3">
          <Link
            href="/dashboard/incidents"
            className="p-2 border border-border bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-heading font-bold tracking-wider">[CREATE] MANUAL_INCIDENT</h1>
            <p className="text-xs font-mono text-text-muted mt-0.5">DECLARE AN OUTAGE OR SCHEDULED MAINTENANCE</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="bg-surface border border-border p-6 rounded-xs space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase text-text-muted mb-2">
                INCIDENT_TITLE *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Degraded Database Connectivity in Frankfurt"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase text-text-muted mb-2">
                  AFFECTED_MONITOR (OPTIONAL)
                </label>
                <select
                  value={formData.monitorId}
                  onChange={(e) => setFormData({ ...formData, monitorId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                >
                  <option value="">Global / Infrastructure-wide</option>
                  {monitors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-text-muted mb-2">
                  INITIAL_STATUS
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                >
                  <option value="investigating">Investigating</option>
                  <option value="identified">Identified</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-text-muted mb-2">
                INITIAL_STATUS_MESSAGE
              </label>
              <textarea
                rows={4}
                placeholder="We are actively investigating intermittent timeouts on European edge nodes..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/incidents"
              className="px-4 py-2 border border-border rounded-xs bg-surface text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-accent bg-accent hover:bg-accent-hover text-black font-bold rounded-xs text-xs font-mono flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'CREATING...' : 'PUBLISH_INCIDENT'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
