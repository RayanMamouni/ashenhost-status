'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Activity,
  AlertTriangle,
  Radio,
  Sliders,
  LogOut,
  ExternalLink,
  Layers,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const orgSlug = (session?.user as any)?.organizationSlug || 'ashenhost';
  const orgName = (session?.user as any)?.organizationName || 'CORE INFRASTRUCTURE';
  const role = (session?.user as any)?.role || 'ADMIN';

  const navLinks = [
    { label: '[01] MONITORS', href: '/dashboard', icon: Activity },
    { label: '[02] INCIDENTS', href: '/dashboard/incidents', icon: AlertTriangle },
    { label: '[03] STATUS PAGE', href: '/dashboard/status-page', icon: Radio },
    { label: '[04] SETTINGS', href: '/dashboard/settings', icon: Sliders },
    { label: '[05] ADMIN_PANEL', href: '/admin', icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-2 text-accent font-mono text-sm tracking-widest font-bold">
            <Terminal className="w-5 h-5 text-accent" />
            <span>ASHENHOST // OS</span>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex flex-col">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              TENANT_ID
            </span>
            <span className="text-xs font-mono text-text-primary font-semibold truncate">
              {orgName}
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-up glow-up" />
              <span className="text-[10px] font-mono text-status-up uppercase">
                [{role}] ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xs text-xs font-mono tracking-wider transition-colors duration-150 ${
                  isActive
                    ? 'bg-text-primary text-black font-bold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Quick Links */}
      <div className="p-4 border-t border-border space-y-2">
        <Link
          href={`/status/${orgSlug}`}
          target="_blank"
          className="flex items-center justify-between px-3 py-2 text-[11px] font-mono text-text-muted hover:text-accent border border-border rounded-xs bg-surface-subtle transition-colors"
        >
          <span className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5" />
            <span>VIEW_STATUS_PAGE</span>
          </span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center space-x-2 px-3 py-2 text-[11px] font-mono text-status-down hover:bg-surface-subtle rounded-xs transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>TERMINATE_SESSION</span>
        </button>
      </div>
    </aside>
  );
}
