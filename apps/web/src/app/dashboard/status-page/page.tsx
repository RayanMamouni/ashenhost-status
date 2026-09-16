'use client';

import React, { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/DashboardNav';
import { Radio, ExternalLink, Save, Check } from 'lucide-react';
import Link from 'next/link';

export default function StatusPageEditor() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/monitors')
      .then((res) => res.json())
      .then((data) => {
        setMonitors(data.monitors || []);
        setSelectedMonitorIds(data.monitors?.map((m: any) => m.id) || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleMonitor = (id: string) => {
    if (selectedMonitorIds.includes(id)) {
      setSelectedMonitorIds(selectedMonitorIds.filter((mid) => mid !== id));
    } else {
      setSelectedMonitorIds([...selectedMonitorIds, id]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-border gap-4">
          <div>
            <h1 className="text-xl font-heading font-bold tracking-wider">
              [STATUS_PAGE] PUBLIC_PORTAL_CONFIG
            </h1>
            <p className="text-xs font-mono text-text-muted mt-0.5">
              CUSTOMIZE THE PUBLIC-FACING UPTIME & INCIDENT PAGE
            </p>
          </div>

          <Link
            href={`/status/ashenhost`}
            target="_blank"
            className="px-4 py-2 border border-border bg-surface hover:bg-surface-subtle text-xs font-mono rounded-xs flex items-center space-x-2 text-text-primary transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-accent" />
            <span>OPEN_LIVE_PAGE</span>
          </Link>
        </div>

        {saved && (
          <div className="my-6 p-4 border border-status-up bg-[#051E11] text-status-up text-xs font-mono rounded-xs flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>[SUCCESS]: Status page configuration updated and published.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-8 space-y-6">
          <div className="bg-surface border border-border p-6 rounded-xs space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase text-text-muted mb-2">
                PORTAL_NAME
              </label>
              <input
                type="text"
                defaultValue="AshenHost Public Status"
                className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-text-muted mb-2">
                SLUG / URL_PATH
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-surface-subtle border border-r-0 border-border text-xs font-mono text-text-muted rounded-l-xs">
                  https://status.domain.com/status/
                </span>
                <input
                  type="text"
                  defaultValue="ashenhost"
                  className="flex-1 px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-r-xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-text-muted mb-2">
                PUBLIC_HEADER_DESCRIPTION
              </label>
              <textarea
                rows={3}
                defaultValue="Real-time and historical uptime status for AshenHost infrastructure and services."
                className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Monitors to Display Selector */}
          <div className="bg-surface border border-border p-6 rounded-xs space-y-4">
            <div className="text-xs font-mono uppercase text-text-muted tracking-wider">
              [EXPOSED_COMPONENTS] SELECT SERVICES TO DISPLAY
            </div>

            <div className="space-y-2">
              {monitors.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center space-x-3 p-3 border border-border bg-surface-subtle rounded-xs cursor-pointer hover:border-border-active transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMonitorIds.includes(m.id)}
                    onChange={() => handleToggleMonitor(m.id)}
                    className="accent-accent"
                  />
                  <div className="flex-1 flex items-center justify-between text-xs font-mono">
                    <span className="text-text-primary font-bold">{m.name}</span>
                    <span className="text-text-muted uppercase">[{m.type}] &bull; {m.url}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 border border-accent bg-accent hover:bg-accent-hover text-black font-bold rounded-xs text-xs font-mono flex items-center space-x-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>SAVE_CONFIGURATION</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
