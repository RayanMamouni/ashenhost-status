'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HeartbeatBar } from '@/components/HeartbeatBar';
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicStatusPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/status/${params.slug}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center p-4">
        <div className="text-xs font-mono text-text-muted">[CONNECTING_TO_INCIDENT_STREAM...]</div>
      </div>
    );
  }

  const { statusPage, monitors, incidents } = data;
  const activeIncidents = incidents.filter((i: any) => i.status !== 'resolved');
  const isAllUp = activeIncidents.length === 0 && monitors.every((m: any) => m.status === 'up');

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between selection:bg-accent selection:text-white">
      {/* Top Banner */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-surface-subtle border border-border rounded-xs text-accent">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold tracking-wider">{statusPage.name}</h1>
              <p className="text-xs font-mono text-text-muted mt-0.5">{statusPage.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isAllUp ? 'bg-status-up glow-up' : 'bg-status-down glow-down'
              }`}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              {isAllUp ? 'ALL SYSTEMS OPERATIONAL' : 'ACTIVE SERVICE DISRUPTIONS'}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl w-full mx-auto px-6 py-10 space-y-10 flex-1">
        {/* Active Incident Alert Box if any */}
        {activeIncidents.length > 0 && (
          <div className="space-y-4">
            {activeIncidents.map((inc: any) => (
              <div
                key={inc.id}
                className="bg-[#2B0E0E] border border-status-down/50 p-5 rounded-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-status-down" />
                    <h2 className="text-sm font-heading font-bold text-text-primary">
                      {inc.title}
                    </h2>
                  </div>
                  <span className="px-2 py-0.5 border border-status-down text-status-down text-[10px] font-mono font-bold uppercase rounded-xs">
                    [{inc.status}]
                  </span>
                </div>

                {inc.updates?.[0] && (
                  <p className="text-xs font-mono text-[#E0B8B8] leading-relaxed">
                    {inc.updates[0].message}
                  </p>
                )}

                <div className="text-[10px] font-mono text-text-muted">
                  Reported: {format(new Date(inc.startedAt), 'yyyy-MM-dd HH:mm')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Monitored Services List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-mono uppercase text-text-muted">
            <span>SERVICE_COMPONENT</span>
            <span>90_DAY_UPTIME</span>
          </div>

          <div className="space-y-3">
            {monitors.map((m: any) => {
              const total = m.checks?.length || 0;
              const passed = m.checks?.filter((c: any) => c.success).length || 0;
              const uptime = total > 0 ? ((passed / total) * 100).toFixed(2) : '100.00';

              return (
                <div
                  key={m.id}
                  className="bg-surface border border-border p-5 rounded-xs space-y-3 hover:border-border-active transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-heading font-bold text-text-primary">
                        {m.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 border rounded-xs font-bold uppercase ${
                          m.status === 'up'
                            ? 'bg-[#051E11] border-[#0F4A2A] text-status-up'
                            : 'bg-[#2B0E0E] border-[#5E1A1A] text-status-down'
                        }`}
                      >
                        [{m.status}]
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-text-primary">{uptime}%</span>
                  </div>

                  <HeartbeatBar checks={m.checks || []} totalBars={45} />
                </div>
              );
            })}
          </div>
        </section>

        {/* Past Incidents Timeline */}
        <section className="space-y-6 pt-6 border-t border-border">
          <div className="text-xs font-mono uppercase text-text-muted tracking-wider">
            [ARCHIVE] RECENT_INCIDENT_TIMELINES
          </div>

          {incidents.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xs text-xs font-mono text-text-muted">
              No incidents reported in the last 90 days.
            </div>
          ) : (
            <div className="space-y-6">
              {incidents.map((inc: any) => (
                <div key={inc.id} className="bg-surface border border-border p-5 rounded-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-heading font-bold text-text-primary">{inc.title}</h3>
                    <span className="text-[10px] font-mono text-status-up font-bold uppercase">
                      [{inc.status}]
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {inc.updates?.map((u: any) => (
                      <div key={u.id} className="text-xs font-mono pl-3 border-l border-accent/40 space-y-1">
                        <div className="flex items-center space-x-2 text-text-muted text-[10px]">
                          <span className="text-accent uppercase font-bold">[{u.status}]</span>
                          <span>{format(new Date(u.createdAt), 'yyyy-MM-dd HH:mm:ss')}</span>
                        </div>
                        <p className="text-text-primary leading-relaxed">{u.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-6 text-center text-xs font-mono text-text-muted">
        POWERED BY ASHENHOST STATUS MONITORING ENGINE &bull; CYBER-MINIMALIST OS
      </footer>
    </div>
  );
}
