'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { HeartbeatBar } from '@/components/HeartbeatBar';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
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
      <div className="min-h-screen bg-[#030303] text-[#EAEAEA] flex items-center justify-center p-4">
        <div className="text-xs font-mono text-[#666666]">[CONNECTING_TO_STATUS_STREAM...]</div>
      </div>
    );
  }

  const { statusPage, monitors, incidents } = data;
  if (!statusPage) {
    return (
      <div className="min-h-screen bg-[#030303] text-[#EAEAEA] flex items-center justify-center p-4">
        <div className="text-xs font-mono text-[#FF3B3B]">[ERROR]: Status page not found or is private.</div>
      </div>
    );
  }

  const activeIncidents = incidents.filter((i: any) => i.status !== 'resolved');
  const isAllUp = activeIncidents.length === 0 && monitors.every((m: any) => m.status !== 'down');
  const themeColor = statusPage.themeColor || '#9D4EDD';

  return (
    <div
      className="min-h-screen text-[#EAEAEA] flex flex-col"
      style={{ backgroundColor: '#030303', fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Announcement Banner ────────────────────────────────── */}
      {statusPage.announcement && (
        <div
          className="text-center text-xs font-mono py-2 px-4 tracking-wide"
          style={{
            backgroundColor: themeColor + '22',
            borderBottom: `1px solid ${themeColor}55`,
            color: themeColor,
          }}
        >
          📢 &nbsp; {statusPage.announcement}
        </div>
      )}

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <header
        className="border-b"
        style={{ borderColor: '#222222', backgroundColor: '#0A0A0A' }}
      >
        {/* Banner image */}
        {statusPage.bannerUrl && (
          <div className="w-full h-28 overflow-hidden">
            <img
              src={statusPage.bannerUrl}
              alt="Brand Banner"
              className="w-full h-full object-cover opacity-60"
            />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Logo */}
            {statusPage.logoUrl ? (
              <img
                src={statusPage.logoUrl}
                alt="Organization Logo"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xs flex items-center justify-center text-xs font-mono font-bold text-black"
                style={{ backgroundColor: themeColor }}
              >
                {(statusPage.name || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {statusPage.heroTitle || statusPage.name}
              </h1>
              {statusPage.description && (
                <p className="text-xs font-mono text-[#888888] mt-0.5">{statusPage.description}</p>
              )}
            </div>
          </div>

          {/* Global Status Pill */}
          <div
            className="flex items-center space-x-2 px-4 py-2 border rounded-xs"
            style={{
              backgroundColor: isAllUp ? '#051E11' : '#2B0E0E',
              borderColor: isAllUp ? '#0F4A2A' : '#5E1A1A',
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: isAllUp ? '#39FF88' : '#FF3B3B',
                boxShadow: isAllUp ? '0 0 8px #39FF88' : '0 0 8px #FF3B3B',
              }}
            />
            <span
              className="text-xs font-mono font-bold uppercase"
              style={{ color: isAllUp ? '#39FF88' : '#FF3B3B' }}
            >
              {isAllUp ? 'All Systems Operational' : 'Active Disruptions Detected'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-6 py-10 flex-1 space-y-10">
        {/* ── Active Incidents Alert ─────────────────────────────── */}
        {activeIncidents.length > 0 && (
          <div className="space-y-3">
            {activeIncidents.map((inc: any) => (
              <div
                key={inc.id}
                className="border p-5 rounded-xs space-y-2"
                style={{ backgroundColor: '#2B0E0E', borderColor: '#FF3B3B55' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: '#FF3B3B' }} />
                    <h2 className="text-sm font-bold tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {inc.title}
                    </h2>
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border rounded-xs"
                    style={{ color: '#FF3B3B', borderColor: '#FF3B3B55', backgroundColor: '#2B0E0E' }}
                  >
                    [{inc.status.toUpperCase()}]
                  </span>
                </div>
                {inc.updates?.[0] && (
                  <p className="text-xs font-mono leading-relaxed" style={{ color: '#E0B8B8' }}>
                    {inc.updates[0].message}
                  </p>
                )}
                <div className="text-[10px] font-mono" style={{ color: '#666666' }}>
                  Reported: {format(new Date(inc.startedAt), 'MMM dd, yyyy HH:mm UTC')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Monitored Services ────────────────────────────────── */}
        <section className="space-y-3">
          <div
            className="flex items-center justify-between border-b pb-3 text-xs font-mono uppercase tracking-wider"
            style={{ borderColor: '#222222', color: '#666666' }}
          >
            <span>SERVICE</span>
            <span>{statusPage.showUptimeDays || 90} Day Uptime</span>
          </div>

          {monitors.length === 0 && (
            <div
              className="p-8 text-center border border-dashed rounded-xs text-xs font-mono"
              style={{ borderColor: '#333333', color: '#666666' }}
            >
              No services configured on this status page.
            </div>
          )}

          {monitors.map((m: any) => {
            const total = m.checks?.length || 0;
            const passed = m.checks?.filter((c: any) => c.success).length || 0;
            const uptime = total > 0 ? ((passed / total) * 100).toFixed(2) : '—';
            const latestCheck = m.checks?.[0];

            return (
              <div
                key={m.id}
                className="border p-5 rounded-xs space-y-3 transition-colors"
                style={{
                  backgroundColor: '#0A0A0A',
                  borderColor: '#222222',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          m.status === 'up'
                            ? '#39FF88'
                            : m.status === 'down'
                            ? '#FF3B3B'
                            : '#FFB800',
                        boxShadow:
                          m.status === 'up'
                            ? '0 0 6px #39FF88'
                            : m.status === 'down'
                            ? '0 0 6px #FF3B3B'
                            : '0 0 6px #FFB800',
                      }}
                    />
                    <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {m.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase" style={{ color: '#666666' }}>
                      [{m.type}]
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs font-mono">
                    {latestCheck && (
                      <span style={{ color: themeColor }}>{latestCheck.responseTimeMs}ms</span>
                    )}
                    <span className="font-bold" style={{ color: '#EAEAEA' }}>
                      {uptime}%
                    </span>
                  </div>
                </div>
                <HeartbeatBar checks={m.checks || []} totalBars={45} />
                <div className="text-[10px] font-mono" style={{ color: '#555555' }}>
                  Checked every {m.intervalSeconds}s &bull; Region: {m.regions?.[0] || 'eu-central'}
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Incident History ────────────────────────────────────── */}
        {incidents.length > 0 && (
          <section className="space-y-4 pt-6" style={{ borderTop: '1px solid #222222' }}>
            <div className="text-xs font-mono uppercase tracking-wider" style={{ color: '#666666' }}>
              [ARCHIVE] Recent Incident History
            </div>

            <div className="space-y-4">
              {incidents.map((inc: any) => (
                <div
                  key={inc.id}
                  className="border p-5 rounded-xs space-y-3"
                  style={{ backgroundColor: '#0A0A0A', borderColor: '#222222' }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {inc.title}
                    </h3>
                    <span
                      className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border rounded-xs"
                      style={{
                        color: inc.status === 'resolved' ? '#39FF88' : '#FFB800',
                        borderColor: inc.status === 'resolved' ? '#0F4A2A' : '#594311',
                        backgroundColor: inc.status === 'resolved' ? '#051E11' : '#261C08',
                      }}
                    >
                      [{inc.status}]
                    </span>
                  </div>

                  <div className="space-y-2 pl-3" style={{ borderLeft: `2px solid ${themeColor}44` }}>
                    {inc.updates?.map((u: any) => (
                      <div key={u.id} className="space-y-1">
                        <div className="flex items-center space-x-2 text-[10px] font-mono">
                          <span className="font-bold uppercase" style={{ color: themeColor }}>
                            [{u.status}]
                          </span>
                          <span style={{ color: '#666666' }}>
                            {format(new Date(u.createdAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-xs font-mono leading-relaxed" style={{ color: '#CCCCCC' }}>
                          {u.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        className="border-t py-6 text-center text-[11px] font-mono"
        style={{ borderColor: '#222222', backgroundColor: '#0A0A0A', color: '#555555' }}
      >
        {statusPage.footerText || `${statusPage.name} Status — Powered by AshenHost`}
      </footer>
    </div>
  );
}
