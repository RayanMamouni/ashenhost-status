'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardNav } from '@/components/DashboardNav';
import { ArrowLeft, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function IncidentDetailPage() {
  const params = useParams();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('investigating');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchIncident = async () => {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        const found = data.incidents?.find((i: any) => i.id === params.id);
        if (found) {
          setIncident(found);
          setNewStatus(found.status);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [params.id]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/incidents/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, status: newStatus }),
      });

      if (res.ok) {
        setMessage('');
        fetchIncident();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !incident) {
    return (
      <div className="flex min-h-screen bg-background text-text-primary">
        <DashboardNav />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-xs font-mono text-text-muted">[LOADING_TIMELINE...]</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-4xl">
        <div className="pb-6 border-b border-border flex items-center space-x-3">
          <Link
            href="/dashboard/incidents"
            className="p-2 border border-border bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-heading font-bold tracking-wider">{incident.title}</h1>
            <p className="text-xs font-mono text-text-muted mt-0.5">
              CURRENT STATUS: <span className="text-accent uppercase font-bold">{incident.status}</span> &bull; STARTED {format(new Date(incident.startedAt), 'yyyy-MM-dd HH:mm')}
            </p>
          </div>
        </div>

        {/* Post Update Form */}
        <form onSubmit={handleAddUpdate} className="bg-surface border border-border p-6 rounded-xs my-6 space-y-4">
          <div className="text-xs font-mono uppercase text-text-muted tracking-wider">
            [ACTION] POST_STATUS_UPDATE
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                NEW_STATUS
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border font-mono text-xs text-text-primary rounded-xs focus:outline-none focus:border-accent"
              >
                <option value="investigating">Investigating</option>
                <option value="identified">Identified</option>
                <option value="monitoring">Monitoring</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
              STATUS_MESSAGE
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail the progress, mitigation actions, or resolution..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border font-mono text-xs text-text-primary rounded-xs focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 border border-accent bg-accent hover:bg-accent-hover text-black font-bold rounded-xs text-xs font-mono flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'BROADCASTING...' : 'BROADCAST_UPDATE'}</span>
            </button>
          </div>
        </form>

        {/* Incident Timeline */}
        <div className="bg-surface border border-border p-6 rounded-xs my-6">
          <div className="text-xs font-mono uppercase text-text-muted tracking-wider mb-6">
            [CHRONOLOGY] INCIDENT_AUDIT_TRAIL
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
            {incident.updates?.map((upd: any) => (
              <div key={upd.id} className="relative">
                <span className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-accent glow-accent" />
                <div className="flex items-center space-x-3 text-xs font-mono">
                  <span className="text-accent uppercase font-bold">[{upd.status}]</span>
                  <span className="text-text-muted">{format(new Date(upd.createdAt), 'yyyy-MM-dd HH:mm:ss')}</span>
                </div>
                <p className="mt-2 text-xs font-mono text-text-primary leading-relaxed bg-surface-subtle p-3 border border-border rounded-xs">
                  {upd.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
