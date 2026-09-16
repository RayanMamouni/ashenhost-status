'use client';

import React from 'react';
import Link from 'next/link';
import { HeartbeatBar } from './HeartbeatBar';
import { Globe, Server, ShieldCheck, Database, ArrowUpRight, Play, Pause } from 'lucide-react';

interface MonitorCardProps {
  monitor: {
    id: string;
    name: string;
    url: string;
    type: string;
    status: 'up' | 'down' | 'degraded' | 'paused';
    intervalSeconds: number;
    lastCheckedAt: string | null;
    checks: any[];
  };
  onTogglePause?: (id: string, currentStatus: string) => void;
}

export function MonitorCard({ monitor, onTogglePause }: MonitorCardProps) {
  const latestCheck = monitor.checks?.[0];
  const responseTime = latestCheck?.responseTimeMs ?? '--';

  // Calculate 24h uptime percentage
  const totalChecks = monitor.checks?.length || 0;
  const successfulChecks = monitor.checks?.filter((c) => c.success).length || 0;
  const uptimePercent = totalChecks > 0 ? ((successfulChecks / totalChecks) * 100).toFixed(2) : '100.00';

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tcp_port':
        return <Server className="w-3.5 h-3.5 text-accent" />;
      case 'ssl_cert':
        return <ShieldCheck className="w-3.5 h-3.5 text-accent" />;
      case 'dns':
        return <Database className="w-3.5 h-3.5 text-accent" />;
      case 'http':
      default:
        return <Globe className="w-3.5 h-3.5 text-accent" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'up':
        return (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#051E11] border border-[#0F4A2A] rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-status-up glow-up" />
            <span className="text-[10px] font-mono text-status-up uppercase font-bold">ONLINE</span>
          </div>
        );
      case 'down':
        return (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#2B0E0E] border border-[#5E1A1A] rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-status-down glow-down" />
            <span className="text-[10px] font-mono text-status-down uppercase font-bold">DOWN</span>
          </div>
        );
      case 'degraded':
        return (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#261C08] border border-[#594311] rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-status-degraded glow-degraded" />
            <span className="text-[10px] font-mono text-status-degraded uppercase font-bold">DEGRADED</span>
          </div>
        );
      case 'paused':
      default:
        return (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#141414] border border-[#333333] rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-status-paused" />
            <span className="text-[10px] font-mono text-text-muted uppercase">PAUSED</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xs p-5 hover:border-border-active transition-all duration-150 flex flex-col justify-between">
      <div>
        {/* Header: Title, Type & Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 border border-border bg-surface-subtle rounded-xs mt-0.5">
              {getTypeIcon(monitor.type)}
            </div>
            <div>
              <Link
                href={`/dashboard/monitors/${monitor.id}`}
                className="text-sm font-heading font-bold text-text-primary hover:text-accent tracking-wide flex items-center space-x-1"
              >
                <span>{monitor.name}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-muted opacity-60" />
              </Link>
              <div className="text-xs font-mono text-text-muted truncate max-w-[220px] mt-0.5">
                {monitor.url}
              </div>
            </div>
          </div>
          <div>{getStatusBadge(monitor.status)}</div>
        </div>

        {/* Heartbeat Uptime Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted mb-1.5 uppercase">
            <span>Uptime_Activity (Recent)</span>
            <span className="text-text-primary font-bold">{uptimePercent}%</span>
          </div>
          <HeartbeatBar checks={monitor.checks || []} totalBars={32} />
        </div>
      </div>

      {/* Footer Metrics & Actions */}
      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-text-muted uppercase">LATENCY:</span>{' '}
            <span className="text-text-primary font-bold">{responseTime}ms</span>
          </div>
          <div>
            <span className="text-text-muted uppercase">INT:</span>{' '}
            <span className="text-text-primary">{monitor.intervalSeconds}s</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onTogglePause && (
            <button
              onClick={() => onTogglePause(monitor.id, monitor.status)}
              className="p-1.5 border border-border rounded-xs hover:bg-surface-subtle text-text-muted hover:text-text-primary transition-colors"
              title={monitor.status === 'paused' ? 'Resume Monitor' : 'Pause Monitor'}
            >
              {monitor.status === 'paused' ? (
                <Play className="w-3 h-3 text-status-up" />
              ) : (
                <Pause className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
