'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/DashboardNav';
import { HeartbeatBar } from '@/components/HeartbeatBar';
import { ArrowLeft, Trash2, Pause, Play, Activity, Clock, Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function MonitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [monitor, setMonitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonitor = async () => {
    try {
      const res = await fetch(`/api/monitors/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setMonitor(data.monitor);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitor();
    const interval = setInterval(fetchMonitor, 10000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleTogglePause = async () => {
    if (!monitor) return;
    const nextStatus = monitor.status === 'paused' ? 'up' : 'paused';
    await fetch(`/api/monitors/${monitor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchMonitor();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this monitor? All historical data will be lost.')) return;
    await fetch(`/api/monitors/${params.id}`, { method: 'DELETE' });
    router.push('/dashboard');
  };

  if (loading || !monitor) {
    return (
      <div className="flex min-h-screen bg-background text-text-primary">
        <DashboardNav />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-xs font-mono text-text-muted">[FETCHING_TELEMETRY...]</div>
        </main>
      </div>
    );
  }

  // Latency chart data
  const chartData = [...(monitor.checks || [])]
    .reverse()
    .map((c: any) => ({
      time: format(new Date(c.timestamp), 'HH:mm:ss'),
      latency: c.responseTimeMs,
      statusCode: c.statusCode,
      success: c.success,
    }));

  const totalChecks = monitor.checks?.length || 0;
  const successfulChecks = monitor.checks?.filter((c: any) => c.success).length || 0;
  const uptimePercent = totalChecks > 0 ? ((successfulChecks / totalChecks) * 100).toFixed(2) : '100.00';
  const avgLatency =
    totalChecks > 0
      ? Math.round(monitor.checks.reduce((acc: number, c: any) => acc + c.responseTimeMs, 0) / totalChecks)
      : 0;

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl">
        {/* Top Header */}
        <div className="pb-6 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-2 border border-border bg-surface hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-heading font-bold tracking-wider">{monitor.name}</h1>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 border rounded-xs font-bold uppercase ${
                    monitor.status === 'up'
                      ? 'bg-[#051E11] border-[#0F4A2A] text-status-up'
                      : monitor.status === 'down'
                      ? 'bg-[#2B0E0E] border-[#5E1A1A] text-status-down'
                      : 'bg-[#141414] border-[#333333] text-text-muted'
                  }`}
                >
                  [{monitor.status.toUpperCase()}]
                </span>
              </div>
              <p className="text-xs font-mono text-text-muted mt-0.5">{monitor.url}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePause}
              className="px-3 py-2 border border-border rounded-xs bg-surface hover:bg-surface-subtle text-xs font-mono flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {monitor.status === 'paused' ? (
                <>
                  <Play className="w-3.5 h-3.5 text-status-up" />
                  <span>RESUME_MONITOR</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE_MONITOR</span>
                </>
              )}
            </button>

            <button
              onClick={handleDelete}
              className="px-3 py-2 border border-status-down/30 text-status-down hover:bg-status-down/10 rounded-xs text-xs font-mono flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>DELETE</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="bg-surface border border-border p-4 rounded-xs">
            <span className="text-[10px] font-mono text-text-muted uppercase">UPTIME (RECENT)</span>
            <div className="text-2xl font-mono font-bold text-status-up mt-2">{uptimePercent}%</div>
          </div>

          <div className="bg-surface border border-border p-4 rounded-xs">
            <span className="text-[10px] font-mono text-text-muted uppercase">AVG RESPONSE TIME</span>
            <div className="text-2xl font-mono font-bold text-accent mt-2">{avgLatency}ms</div>
          </div>

          <div className="bg-surface border border-border p-4 rounded-xs">
            <span className="text-[10px] font-mono text-text-muted uppercase">CHECK INTERVAL</span>
            <div className="text-2xl font-mono font-bold text-text-primary mt-2">{monitor.intervalSeconds}s</div>
          </div>
        </div>

        {/* Heartbeat Uptime Bars */}
        <div className="bg-surface border border-border p-6 rounded-xs my-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase text-text-muted tracking-wider">
              [TELEMETRY_HEARTBEAT] LAST CHECKS ACTIVITY
            </span>
            <span className="text-xs font-mono text-text-muted">{monitor.checks?.length} checks logged</span>
          </div>
          <HeartbeatBar checks={monitor.checks || []} totalBars={60} />
        </div>

        {/* Latency History Chart */}
        <div className="bg-surface border border-border p-6 rounded-xs my-6">
          <div className="text-xs font-mono uppercase text-text-muted tracking-wider mb-6">
            [CHART] LATENCY OVER TIME (MS)
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="time"
                  stroke="#555555"
                  tick={{ fill: '#666666', fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="#555555"
                  tick={{ fill: '#666666', fontSize: 10, fontFamily: 'monospace' }}
                  unit="ms"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    borderColor: '#222222',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#9D4EDD' }}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#9D4EDD"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#39FF88' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Checks Table */}
        <div className="bg-surface border border-border rounded-xs overflow-hidden my-6">
          <div className="p-4 border-b border-border text-xs font-mono uppercase text-text-muted tracking-wider">
            [LOGS] RECENT TELEMETRY EVENTS
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface-subtle border-b border-border text-text-muted">
                <tr>
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">HTTP CODE</th>
                  <th className="p-3">LATENCY</th>
                  <th className="p-3">ERROR / NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monitor.checks?.slice(0, 15).map((chk: any) => (
                  <tr key={chk.id} className="hover:bg-surface-subtle">
                    <td className="p-3 text-text-secondary">
                      {format(new Date(chk.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          chk.success ? 'text-status-up font-bold' : 'text-status-down font-bold'
                        }
                      >
                        [{chk.success ? 'PASS' : 'FAIL'}]
                      </span>
                    </td>
                    <td className="p-3 text-text-primary">{chk.statusCode ?? '--'}</td>
                    <td className="p-3 text-accent">{chk.responseTimeMs}ms</td>
                    <td className="p-3 text-text-muted truncate max-w-xs">
                      {chk.errorMessage || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
