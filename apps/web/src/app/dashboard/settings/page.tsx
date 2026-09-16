'use client';

import React, { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/DashboardNav';
import { Bell, Plus, Users, CreditCard, Check, Trash2, Mail, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChannel, setNewChannel] = useState({ name: '', type: 'email', configValue: '' });
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = async () => {
    try {
      const [chRes, adminRes] = await Promise.all([
        fetch('/api/notifications/channels'),
        fetch('/api/admin'),
      ]);
      if (chRes.ok) {
        const d = await chRes.json();
        setChannels(d.channels || []);
      }
      if (adminRes.ok) {
        const d = await adminRes.json();
        setMembers(d.organization?.memberships || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        body: JSON.stringify({ name: newChannel.name, type: newChannel.type, config }),
      });
      if (res.ok) {
        setNewChannel({ name: '', type: 'email', configValue: '' });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Remove this notification channel?')) return;
    await fetch(`/api/notifications/channels/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-5xl space-y-10">
        <div className="pb-6 border-b border-border">
          <h1 className="text-xl font-heading font-bold tracking-wider">[SETTINGS] TENANT_PREFERENCES</h1>
          <p className="text-xs font-mono text-text-muted mt-0.5">NOTIFICATIONS, TEAM MEMBERS &bull; <span className="text-accent">For full branding & audit logs go to <a href="/admin" className="underline">/admin</a></span></p>
        </div>

        {saved && (
          <div className="p-4 border border-status-up bg-[#051E11] text-status-up text-xs font-mono rounded-xs flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>[OK] Notification channel saved.</span>
          </div>
        )}

        {/* Notification Channels */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-accent font-bold tracking-wider">
            <Bell className="w-4 h-4" />
            <span>[01] NOTIFICATION_CHANNELS</span>
          </div>

          <div className="bg-surface border border-border rounded-xs divide-y divide-border">
            {loading && (
              <div className="p-6 text-xs font-mono text-text-muted text-center">LOADING...</div>
            )}
            {!loading && channels.length === 0 && (
              <div className="p-6 text-xs font-mono text-text-muted text-center">No channels configured yet.</div>
            )}
            {channels.map((ch) => (
              <div key={ch.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-heading font-bold">{ch.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 border border-border bg-surface-subtle text-text-muted uppercase rounded-xs">
                      [{ch.type}]
                    </span>
                    {ch.isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-status-up glow-up" />
                    )}
                  </div>
                  <div className="text-xs font-mono text-text-muted mt-0.5">
                    {ch.config?.email || ch.config?.slackWebhookUrl || ch.config?.webhookUrl}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteChannel(ch.id)}
                  className="p-1.5 border border-border rounded-xs text-text-muted hover:text-status-down hover:border-status-down/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateChannel} className="bg-surface border border-border p-5 rounded-xs space-y-4">
            <div className="text-xs font-mono uppercase text-text-muted tracking-wider">+ ADD NOTIFICATION DESTINATION</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">LABEL</label>
                <input type="text" required placeholder="e.g. SRE Slack Alerts" value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">TYPE</label>
                <select value={newChannel.type} onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent">
                  <option value="email">Email (SMTP)</option>
                  <option value="slack">Slack Webhook</option>
                  <option value="webhook">Generic Webhook</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                  {newChannel.type === 'email' ? 'EMAIL ADDRESS' : 'WEBHOOK URL'}
                </label>
                <input type="text" required placeholder={newChannel.type === 'email' ? 'ops@company.com' : 'https://hooks.slack.com/...'}
                  value={newChannel.configValue} onChange={(e) => setNewChannel({ ...newChannel, configValue: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={creating}
                className="px-4 py-2 border border-accent bg-accent hover:bg-accent-hover text-black font-bold text-xs font-mono rounded-xs transition-colors disabled:opacity-50">
                {creating ? 'SAVING...' : 'REGISTER_CHANNEL'}
              </button>
            </div>
          </form>
        </section>

        {/* Team Members */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-accent font-bold tracking-wider">
            <Users className="w-4 h-4" />
            <span>[02] TEAM_MEMBERS</span>
          </div>

          <div className="bg-surface border border-border rounded-xs divide-y divide-border">
            {members.map((m: any) => (
              <div key={m.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-heading font-bold">{m.user?.name || 'Unknown'}</div>
                  <div className="text-xs font-mono text-text-muted">{m.user?.email}</div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 border rounded-xs font-bold uppercase ${
                  m.role === 'admin'
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-surface-subtle text-text-muted'
                }`}>
                  [{m.role}]
                </span>
              </div>
            ))}
            {members.length === 0 && !loading && (
              <div className="p-6 text-xs font-mono text-text-muted text-center">No members found.</div>
            )}
          </div>
        </section>

        {/* Billing */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-accent font-bold tracking-wider">
            <CreditCard className="w-4 h-4" />
            <span>[03] SUBSCRIPTION_PLAN</span>
          </div>
          <div className="bg-surface border border-border rounded-xs p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-heading font-bold">CURRENT TIER: PRO ENTERPRISE</div>
              <div className="text-xs font-mono text-text-muted mt-0.5">
                Unlimited monitors &bull; 30s check frequency &bull; Multi-channel alerting
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
