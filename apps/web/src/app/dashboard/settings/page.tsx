'use client';

import React, { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/DashboardNav';
import { Bell, Plus, Users, CreditCard, Mail, Slack, Webhook, Check } from 'lucide-react';

export default function SettingsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChannel, setNewChannel] = useState({
    name: '',
    type: 'email',
    configValue: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/notifications/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    let config: any = {};
    if (newChannel.type === 'email') config = { email: newChannel.configValue };
    if (newChannel.type === 'slack') config = { slackWebhookUrl: newChannel.configValue };
    if (newChannel.type === 'webhook') config = { webhookUrl: newChannel.configValue };

    try {
      const res = await fetch('/api/notifications/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannel.name,
          type: newChannel.type,
          config,
        }),
      });

      if (res.ok) {
        setNewChannel({ name: '', type: 'email', configValue: '' });
        fetchChannels();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-5xl space-y-10">
        <div className="pb-6 border-b border-border">
          <h1 className="text-xl font-heading font-bold tracking-wider">[SETTINGS] TENANT_PREFERENCES</h1>
          <p className="text-xs font-mono text-text-muted mt-0.5">NOTIFICATIONS, TEAM MEMBERS & SUBSCRIPTION</p>
        </div>

        {/* Notification Channels Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-accent font-bold tracking-wider">
            <Bell className="w-4 h-4" />
            <span>[01] ALERTING & NOTIFICATION_CHANNELS</span>
          </div>

          <div className="bg-surface border border-border rounded-xs divide-y divide-border">
            {channels.map((ch) => (
              <div key={ch.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-heading font-bold text-text-primary">{ch.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 border border-border bg-surface-subtle text-text-muted uppercase rounded-xs">
                      [{ch.type}]
                    </span>
                  </div>
                  <div className="text-xs font-mono text-text-muted mt-1">
                    TARGET: {ch.config?.email || ch.config?.slackWebhookUrl || ch.config?.webhookUrl}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-up glow-up" />
                  <span className="text-[10px] font-mono text-status-up font-bold">ACTIVE</span>
                </div>
              </div>
            ))}

            {channels.length === 0 && !loading && (
              <div className="p-6 text-center text-xs font-mono text-text-muted">
                No notification channels configured yet.
              </div>
            )}
          </div>

          {/* Add Notification Form */}
          <form onSubmit={handleCreateChannel} className="bg-surface border border-border p-5 rounded-xs space-y-4">
            <div className="text-xs font-mono uppercase text-text-muted tracking-wider">
              + ADD NOTIFICATION DESTINATION
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                  CHANNEL_LABEL
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SRE Urgent Slack"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                  TYPE
                </label>
                <select
                  value={newChannel.type}
                  onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack Webhook</option>
                  <option value="webhook">Generic Webhook (JSON)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                  TARGET (EMAIL / WEBHOOK URL)
                </label>
                <input
                  type="text"
                  required
                  placeholder={newChannel.type === 'email' ? 'ops@company.com' : 'https://hooks.slack.com/...'}
                  value={newChannel.configValue}
                  onChange={(e) => setNewChannel({ ...newChannel, configValue: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 border border-accent bg-accent hover:bg-accent-hover text-black font-bold text-xs font-mono rounded-xs transition-colors disabled:opacity-50"
              >
                {creating ? 'SAVING...' : 'REGISTER_CHANNEL'}
              </button>
            </div>
          </form>
        </section>

        {/* Team Members Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-accent font-bold tracking-wider">
            <Users className="w-4 h-4" />
            <span>[02] TEAM_ROLES & ACCESS_CONTROL</span>
          </div>

          <div className="bg-surface border border-border rounded-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <div className="text-xs font-heading font-bold text-text-primary">System Admin</div>
                <div className="text-xs font-mono text-text-muted">admin@ashenhost.com</div>
              </div>
              <span className="px-2 py-0.5 border border-accent/40 bg-accent/10 text-accent text-[10px] font-mono font-bold uppercase rounded-xs">
                [ADMIN]
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-xs font-mono text-text-muted">
                Invite additional teammates to view telemetry or manage monitors.
              </p>
              <button
                onClick={() => alert('Invite sent to queue!')}
                className="px-3 py-1.5 border border-border bg-surface-subtle hover:bg-text-primary hover:text-black text-xs font-mono rounded-xs transition-colors"
              >
                + INVITE_MEMBER
              </button>
            </div>
          </div>
        </section>

        {/* Subscription & Billing Section */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-accent font-bold tracking-wider">
            <CreditCard className="w-4 h-4" />
            <span>[03] SUBSCRIPTION_PLAN</span>
          </div>

          <div className="bg-surface border border-border rounded-xs p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-heading font-bold text-text-primary">CURRENT TIER: PRO ENTERPRISE</div>
              <div className="text-xs font-mono text-text-muted mt-0.5">
                Up to 100 monitors &bull; 30s check frequency &bull; Unlimited SMS & Webhook alerting
              </div>
            </div>
            <span className="px-2.5 py-1 border border-status-up/30 bg-status-up/10 text-status-up text-xs font-mono font-bold uppercase rounded-xs">
              ACTIVE
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
