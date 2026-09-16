'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardNav } from '@/components/DashboardNav';
import { MonitorCard } from '@/components/MonitorCard';
import { Plus, RefreshCw, Filter, Activity, Server, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'up' | 'down' | 'paused'>('all');

  const fetchMonitors = async () => {
    try {
      const res = await fetch('/api/monitors');
      if (res.ok) {
        const data = await res.json();
        setMonitors(data.monitors || []);
      }
    } catch (err) {
      console.error('Error fetching monitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();

    // Listen to live Server-Sent Events (SSE)
    const eventSource = new EventSource('/api/sse');
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'monitors_update') {
          // Soft update status and latency
          setMonitors((prev) =>
            prev.map((m) => {
              const match = parsed.monitors.find((pm: any) => pm.id === m.id);
              if (match) {
                return {
                  ...m,
                  status: match.status,
                  lastCheckedAt: match.lastCheckedAt,
                  checks: match.checks?.length ? [match.checks[0], ...m.checks.slice(0, 49)] : m.checks,
                };
              }
              return m;
            })
          );
        }
      } catch (e) {
        // Silent error handling on malformed chunk
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleTogglePause = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'paused' ? 'up' : 'paused';
    try {
      await fetch(`/api/monitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchMonitors();
    } catch (e) {
      console.error(e);
    }
  };

  // Stats calculation
  const totalCount = monitors.length;
  const upCount = monitors.filter((m) => m.status === 'up').length;
  const downCount = monitors.filter((m) => m.status === 'down').length;
  const pausedCount = monitors.filter((m) => m.status === 'paused').length;

  const filteredMonitors = monitors.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-xl font-heading font-bold tracking-wider text-text-primary">
              [SYSTEM_STATUS] MONITORING_GRID
            </h1>
            <p className="text-xs font-mono text-text-muted mt-1">
              REAL-TIME UPTIME TELEMETRY &bull; NODE: EU-CENTRAL-1
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchMonitors}
              className="px-3 py-2 border border-border rounded-xs bg-surface hover:bg-surface-subtle text-xs font-mono flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REFRESH</span>
            </button>

            <Link
              href="/dashboard/monitors/new"
              className="px-4 py-2 border border-accent bg-accent hover:bg-accent-hover text-black font-bold rounded-xs text-xs font-mono flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW_MONITOR</span>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-surface border border-border p-4 rounded-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted uppercase">TOTAL_TARGETS</span>
              <Server className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-2xl font-mono font-bold text-text-primary mt-2">{totalCount}</div>
          </div>

          <div className="bg-surface border border-border p-4 rounded-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-status-up uppercase font-bold">OPERATIONAL</span>
              <span className="w-2 h-2 rounded-full bg-status-up glow-up" />
            </div>
            <div className="text-2xl font-mono font-bold text-status-up mt-2">{upCount}</div>
          </div>

          <div className="bg-surface border border-border p-4 rounded-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-status-down uppercase font-bold">OUTAGES</span>
              <AlertCircle className="w-4 h-4 text-status-down" />
            </div>
            <div className="text-2xl font-mono font-bold text-status-down mt-2">{downCount}</div>
          </div>

          <div className="bg-surface border border-border p-4 rounded-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted uppercase">PAUSED</span>
              <Activity className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-2xl font-mono font-bold text-text-muted mt-2">{pausedCount}</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2 pb-4">
          <Filter className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[11px] font-mono text-text-muted uppercase mr-2">FILTER_VIEW:</span>
          {(['all', 'up', 'down', 'paused'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 text-[11px] font-mono rounded-xs border transition-colors ${
                filter === mode
                  ? 'bg-text-primary text-black border-text-primary font-bold'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              [{mode.toUpperCase()}]
            </button>
          ))}
        </div>

        {/* Monitors Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-text-muted border border-border bg-surface rounded-xs">
            [INITIALIZING_TELEMETRY_STREAM...]
          </div>
        ) : filteredMonitors.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border bg-surface rounded-xs">
            <p className="text-xs font-mono text-text-muted">NO MONITORS CONFIGURED MATCHING SELECTION.</p>
            <Link
              href="/dashboard/monitors/new"
              className="inline-block mt-4 px-3 py-1.5 border border-accent text-accent hover:bg-accent hover:text-black text-xs font-mono rounded-xs transition-colors"
            >
              + CREATE FIRST MONITOR
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMonitors.map((monitor) => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                onTogglePause={handleTogglePause}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
