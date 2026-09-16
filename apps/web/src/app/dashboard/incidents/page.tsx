'use client';

import React, { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/DashboardNav';
import { Plus, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2 py-0.5 border border-[#0F4A2A] bg-[#051E11] text-status-up text-[10px] font-mono font-bold uppercase rounded-xs">
            [RESOLVED]
          </span>
        );
      case 'investigating':
        return (
          <span className="px-2 py-0.5 border border-[#5E1A1A] bg-[#2B0E0E] text-status-down text-[10px] font-mono font-bold uppercase rounded-xs">
            [INVESTIGATING]
          </span>
        );
      case 'identified':
        return (
          <span className="px-2 py-0.5 border border-[#594311] bg-[#261C08] text-status-degraded text-[10px] font-mono font-bold uppercase rounded-xs">
            [IDENTIFIED]
          </span>
        );
      case 'monitoring':
      default:
        return (
          <span className="px-2 py-0.5 border border-accent/40 bg-accent/10 text-accent text-[10px] font-mono font-bold uppercase rounded-xs">
            [MONITORING]
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-xl font-heading font-bold tracking-wider">
              [INCIDENT_MANAGEMENT] ACTIVE & LOGGED OUTAGES
            </h1>
            <p className="text-xs font-mono text-text-muted mt-0.5">
              SYSTEM DISRUPTIONS &bull; AUTOMATED & MANUAL INCIDENT TIMELINES
            </p>
          </div>

          <Link
            href="/dashboard/incidents/new"
            className="px-4 py-2 border border-accent bg-accent hover:bg-accent-hover text-black font-bold rounded-xs text-xs font-mono flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>REPORT_INCIDENT</span>
          </Link>
        </div>

        {/* Incidents List */}
        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-text-muted border border-border bg-surface rounded-xs">
              [FETCHING_INCIDENT_TIMELINES...]
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border bg-surface rounded-xs">
              <CheckCircle className="w-8 h-8 text-status-up mx-auto mb-2 opacity-80" />
              <p className="text-xs font-mono text-text-primary font-bold">ALL SYSTEMS OPERATIONAL</p>
              <p className="text-xs font-mono text-text-muted mt-1">No incidents reported across monitored services.</p>
            </div>
          ) : (
            incidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-surface border border-border rounded-xs p-5 hover:border-border-active transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-sm font-heading font-bold text-text-primary tracking-wide">
                        {incident.title}
                      </h2>
                      {getStatusBadge(incident.status)}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs font-mono text-text-muted">
                      <span>STARTED: {format(new Date(incident.startedAt), 'yyyy-MM-dd HH:mm')}</span>
                      {incident.monitor && (
                        <span>TARGET: <strong className="text-text-primary">{incident.monitor.name}</strong></span>
                      )}
                      <span>ORIGIN: {incident.isManual ? 'MANUAL REPORT' : 'AUTOMATED ALERT'}</span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/incidents/${incident.id}`}
                    className="px-3 py-1.5 border border-border bg-surface-subtle hover:bg-text-primary hover:text-black text-xs font-mono rounded-xs transition-colors"
                  >
                    UPDATE_TIMELINE &rarr;
                  </Link>
                </div>

                {/* Latest update preview */}
                {incident.updates?.[0] && (
                  <div className="mt-4 pt-3 border-t border-border text-xs font-mono">
                    <span className="text-text-muted">LATEST UPDATE ({format(new Date(incident.updates[0].createdAt), 'HH:mm')}): </span>
                    <span className="text-text-primary">{incident.updates[0].message}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
