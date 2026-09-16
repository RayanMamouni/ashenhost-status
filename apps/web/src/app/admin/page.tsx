'use client';

import React, { useEffect, useState } from 'react';
import { DashboardNav } from '@/components/DashboardNav';
import {
  ShieldAlert,
  Sliders,
  FileText,
  Palette,
  Image as ImageIcon,
  Save,
  Check,
  RefreshCw,
  Search,
  Filter,
  User,
  Clock,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AdminControlPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'branding' | 'system'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [statusPage, setStatusPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Branding state
  const [brandForm, setBrandForm] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    bannerUrl: '',
    primaryColor: '#9D4EDD',
    customCss: '',
  });

  // Status page customizer state
  const [statusForm, setStatusForm] = useState({
    heroTitle: '',
    announcement: '',
    themeColor: '#9D4EDD',
    footerText: '',
    showUptimeDays: 90,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminRes, statusRes] = await Promise.all([
        fetch(`/api/admin?action=${filterAction}`),
        fetch('/api/admin/status-page'),
      ]);

      if (adminRes.ok) {
        const d = await adminRes.json();
        setLogs(d.logs || []);
        setOrganization(d.organization);
        if (d.organization) {
          setBrandForm({
            name: d.organization.name || '',
            slug: d.organization.slug || '',
            logoUrl: d.organization.logoUrl || '',
            bannerUrl: d.organization.bannerUrl || '',
            primaryColor: d.organization.primaryColor || '#9D4EDD',
            customCss: d.organization.customCss || '',
          });
        }
      }

      if (statusRes.ok) {
        const sd = await statusRes.json();
        setStatusPage(sd.statusPage);
        if (sd.statusPage) {
          setStatusForm({
            heroTitle: sd.statusPage.heroTitle || 'System Status',
            announcement: sd.statusPage.announcement || '',
            themeColor: sd.statusPage.themeColor || '#9D4EDD',
            footerText: sd.statusPage.footerText || '',
            showUptimeDays: sd.statusPage.showUptimeDays || 90,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAction]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const [orgRes, spRes] = await Promise.all([
        fetch('/api/admin', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brandForm),
        }),
        fetch('/api/admin/status-page', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...statusPage,
            ...statusForm,
            logoUrl: brandForm.logoUrl,
            bannerUrl: brandForm.bannerUrl,
            themeColor: brandForm.primaryColor,
          }),
        }),
      ]);

      if (orgRes.ok && spRes.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.actorEmail.toLowerCase().includes(s) ||
      log.resourceType.toLowerCase().includes(s) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <DashboardNav />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl space-y-8">
        {/* Top Header */}
        <div className="pb-6 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-accent" />
              <h1 className="text-xl font-heading font-bold tracking-wider">
                [ADMIN_PANEL] SYSTEM_CONTROLS & AUDIT_TRAIL
              </h1>
            </div>
            <p className="text-xs font-mono text-text-muted mt-1">
              FULL TENANT CUSTOMIZATION &bull; OPERATIONAL AUDIT LOGS &bull; REPUTATION ENGINE
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
              className="px-3 py-2 border border-border bg-surface hover:bg-surface-subtle text-xs font-mono rounded-xs flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>SYNC_DATA</span>
            </button>

            {organization?.slug && (
              <Link
                href={`/status/${organization.slug}`}
                target="_blank"
                className="px-4 py-2 border border-accent/40 bg-accent/10 hover:bg-accent hover:text-black text-accent text-xs font-mono rounded-xs flex items-center space-x-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>VIEW_CUSTOM_STATUS</span>
              </Link>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs border transition-colors flex items-center space-x-2 ${
              activeTab === 'logs'
                ? 'bg-text-primary text-black border-text-primary font-bold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>[01] AUDIT_LOGS ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs border transition-colors flex items-center space-x-2 ${
              activeTab === 'branding'
                ? 'bg-text-primary text-black border-text-primary font-bold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>[02] BRANDING_AND_CUSTOMIZATION</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs border transition-colors flex items-center space-x-2 ${
              activeTab === 'system'
                ? 'bg-text-primary text-black border-text-primary font-bold'
                : 'bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>[03] TENANT_METRICS</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 border border-status-up bg-[#051E11] text-status-up text-xs font-mono rounded-xs flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>[UPDATED]: All customizations and system settings applied across the platform!</span>
          </div>
        )}

        {/* TAB 1: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="FILTER LOGS BY ACTOR, ACTION OR ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="w-3.5 h-3.5 text-text-muted" />
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="px-3 py-2 bg-surface border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                >
                  <option value="ALL">ALL ACTIONS</option>
                  <option value="CREATE_MONITOR">CREATE_MONITOR</option>
                  <option value="DELETE_MONITOR">DELETE_MONITOR</option>
                  <option value="UPDATE_ORGANIZATION_CONFIG">UPDATE_ORGANIZATION_CONFIG</option>
                  <option value="UPDATE_STATUS_PAGE_CUSTOMIZATION">UPDATE_STATUS_PAGE_CUSTOMIZATION</option>
                </select>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-surface border border-border rounded-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-surface-subtle border-b border-border text-text-muted">
                    <tr>
                      <th className="p-3">TIMESTAMP</th>
                      <th className="p-3">OPERATOR / ACTOR</th>
                      <th className="p-3">ACTION</th>
                      <th className="p-3">RESOURCE</th>
                      <th className="p-3">PAYLOAD / DETAILS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-text-muted">
                          NO AUDIT LOGS FOUND MATCHING FILTER CRITERIA.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-surface-subtle transition-colors">
                          <td className="p-3 text-text-secondary whitespace-nowrap">
                            {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <User className="w-3 h-3 text-accent" />
                              <span className="text-text-primary font-bold">{log.actorEmail}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 border border-border bg-surface-subtle text-accent uppercase font-bold rounded-xs">
                              [{log.action}]
                            </span>
                          </td>
                          <td className="p-3 text-text-secondary">
                            {log.resourceType} {log.resourceId ? `(${log.resourceId.slice(-6)})` : ''}
                          </td>
                          <td className="p-3 text-text-muted max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BRANDING & FULL SYSTEM CUSTOMIZATION */}
        {activeTab === 'branding' && (
          <form onSubmit={handleSaveBranding} className="space-y-6">
            {/* Organization identity */}
            <div className="bg-surface border border-border p-6 rounded-xs space-y-5">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase text-accent font-bold tracking-wider">
                <Palette className="w-4 h-4" />
                <span>TENANT_IDENTITY & BRANDING</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                    ORGANIZATION_DISPLAY_NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                    ORGANIZATION_SLUG (URL IDENTIFIER)
                  </label>
                  <input
                    type="text"
                    required
                    value={brandForm.slug}
                    onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                    LOGO_IMAGE_URL (HTTPS)
                  </label>
                  <input
                    type="url"
                    placeholder="https://mycompany.com/assets/logo.png"
                    value={brandForm.logoUrl}
                    onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                  />
                  {brandForm.logoUrl && (
                    <div className="mt-2 p-2 bg-surface-subtle border border-border rounded-xs inline-block">
                      <img src={brandForm.logoUrl} alt="Logo Preview" className="h-8 max-w-xs object-contain" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                    BANNER_HEADER_IMAGE_URL (HTTPS)
                  </label>
                  <input
                    type="url"
                    placeholder="https://mycompany.com/assets/banner.png"
                    value={brandForm.bannerUrl}
                    onChange={(e) => setBrandForm({ ...brandForm, bannerUrl: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                  />
                  {brandForm.bannerUrl && (
                    <div className="mt-2 p-2 bg-surface-subtle border border-border rounded-xs">
                      <img src={brandForm.bannerUrl} alt="Banner Preview" className="h-16 w-full object-cover rounded-xs" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                  BRAND_ACCENT_COLOR (HEX)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={brandForm.primaryColor}
                    onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                    className="w-10 h-10 bg-transparent border border-border rounded-xs cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={brandForm.primaryColor}
                    onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                    className="w-36 px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Public Status Page Customizations */}
            <div className="bg-surface border border-border p-6 rounded-xs space-y-5">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase text-accent font-bold tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>STATUS_PAGE_CONTENT & BROADCAST_BANNER</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                    HERO_HEADING_TITLE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Network & Cloud Services Status"
                    value={statusForm.heroTitle}
                    onChange={(e) => setStatusForm({ ...statusForm, heroTitle: e.target.value })}
                    className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                    SHOW_UPTIME_HISTORY_DAYS
                  </label>
                  <select
                    value={statusForm.showUptimeDays}
                    onChange={(e) => setStatusForm({ ...statusForm, showUptimeDays: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days (Standard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                  LIVE_ANNOUNCEMENT_BANNER (TOP BROADCAST)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled maintenance on Singapore database cluster this Saturday 02:00 UTC"
                  value={statusForm.announcement}
                  onChange={(e) => setStatusForm({ ...statusForm, announcement: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                  CUSTOM_FOOTER_NOTICE
                </label>
                <input
                  type="text"
                  placeholder="e.g. &copy; 2026 Acme Corp. All rights reserved. SRE Operations."
                  value={statusForm.footerText}
                  onChange={(e) => setStatusForm({ ...statusForm, footerText: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-text-muted mb-1">
                  CUSTOM_CSS_OVERRIDE
                </label>
                <textarea
                  rows={3}
                  placeholder="/* e.g. .status-card { border-radius: 8px; } */"
                  value={brandForm.customCss}
                  onChange={(e) => setBrandForm({ ...brandForm, customCss: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border text-xs font-mono text-text-primary rounded-xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 border border-accent bg-accent hover:bg-accent-hover text-black font-bold rounded-xs text-xs font-mono flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'APPLYING_MODIFICATIONS...' : 'SAVE_ALL_CUSTOMIZATIONS'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SYSTEM STATS & CLUSTER OVERVIEW */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-border p-6 rounded-xs">
              <span className="text-xs font-mono text-text-muted uppercase">ORGANIZATION_MEMBERS</span>
              <div className="text-3xl font-mono font-bold text-text-primary mt-2">
                {organization?.memberships?.length || 1}
              </div>
              <p className="text-[11px] font-mono text-text-muted mt-2">Active seats on tenant license</p>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xs">
              <span className="text-xs font-mono text-text-muted uppercase">ACTIVE_MONITORS</span>
              <div className="text-3xl font-mono font-bold text-accent mt-2">
                {organization?.monitors?.length || 0}
              </div>
              <p className="text-[11px] font-mono text-text-muted mt-2">Services continuously polled</p>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xs">
              <span className="text-xs font-mono text-text-muted uppercase">AUDIT_EVENTS_RECORDED</span>
              <div className="text-3xl font-mono font-bold text-status-up mt-2">
                {logs.length}
              </div>
              <p className="text-[11px] font-mono text-text-muted mt-2">Tamper-evident logs logged</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
