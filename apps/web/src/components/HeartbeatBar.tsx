'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';

interface HeartbeatBarProps {
  checks: Array<{
    id: string;
    timestamp: string | Date;
    responseTimeMs: number;
    statusCode: number | null;
    success: boolean;
    errorMessage?: string | null;
  }>;
  totalBars?: number;
}

export function HeartbeatBar({ checks = [], totalBars = 30 }: HeartbeatBarProps) {
  const [hoveredCheck, setHoveredCheck] = useState<any | null>(null);

  // Pad or slice checks to fixed totalBars count
  const sortedChecks = [...checks].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const displayChecks = sortedChecks.slice(-totalBars);
  const emptySlots = Math.max(0, totalBars - displayChecks.length);

  return (
    <div className="relative flex flex-col space-y-2">
      {/* Bars container */}
      <div className="flex items-center space-x-1 h-7">
        {Array.from({ length: emptySlots }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="flex-1 h-full bg-[#181818] rounded-xs opacity-50"
          />
        ))}

        {displayChecks.map((chk, idx) => {
          let barBg = 'bg-status-up';
          if (!chk.success) {
            barBg = 'bg-status-down';
          } else if (chk.responseTimeMs > 400) {
            barBg = 'bg-status-degraded';
          }

          return (
            <div
              key={chk.id || idx}
              onMouseEnter={() => setHoveredCheck(chk)}
              onMouseLeave={() => setHoveredCheck(null)}
              className={`flex-1 h-full ${barBg} rounded-xs cursor-pointer hover:opacity-80 transition-opacity`}
            />
          );
        })}
      </div>

      {/* Terminal Style Tooltip */}
      {hoveredCheck && (
        <div className="absolute -top-12 left-0 z-20 bg-surface border border-border px-2.5 py-1 text-[10px] font-mono text-text-primary rounded-xs shadow-lg flex items-center space-x-3">
          <span className="text-text-muted">
            {format(new Date(hoveredCheck.timestamp), 'HH:mm:ss')}
          </span>
          <span
            className={
              hoveredCheck.success ? 'text-status-up font-bold' : 'text-status-down font-bold'
            }
          >
            {hoveredCheck.success ? `[HTTP ${hoveredCheck.statusCode || 200}]` : '[DOWN]'}
          </span>
          <span className="text-accent">{hoveredCheck.responseTimeMs}ms</span>
          {hoveredCheck.errorMessage && (
            <span className="text-status-down truncate max-w-xs">{hoveredCheck.errorMessage}</span>
          )}
        </div>
      )}
    </div>
  );
}
