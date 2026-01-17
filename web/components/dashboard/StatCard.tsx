"use client";

import React from 'react';
import { Card } from '../ui/Card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function StatCard({ label, value, trend, trendDirection = 'neutral', icon }: StatCardProps) {
  return (
    <Card title={label} interactive={true} className="h-full">
      <div className="flex flex-col h-full justify-between gap-4">
        <div className="flex items-start justify-between">
           <span className="text-4xl font-semibold tracking-tighter text-text-primary font-sans">
             {value}
           </span>
           {icon && (
             <div className="text-text-tertiary">
               {icon}
             </div>
           )}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-border-subtle">
            {trendDirection === 'up' && <ArrowUpRight size={14} className="text-accent-primary" />}
            {trendDirection === 'down' && <ArrowDownRight size={14} className="text-accent-primary" />}
            {trendDirection === 'neutral' && <Minus size={14} className="text-text-tertiary" />}

            <span className={`text-xs font-mono font-medium ${
              trendDirection === 'up' ? 'text-accent-primary' :
              trendDirection === 'down' ? 'text-accent-primary' : 'text-text-secondary'
            }`}>
              {trend}
            </span>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wide ml-1">vs last week</span>
          </div>
        )}
      </div>
    </Card>
  );
}
