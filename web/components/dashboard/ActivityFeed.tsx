"use client";

import React from 'react';
import { Card } from '../ui/Card';
import { CheckCircle2, Clock, FileText } from 'lucide-react';

export function ActivityFeed() {
  const items = [
    { id: 1, type: 'complete', title: 'Pharmacology Quiz', time: '14:20', date: 'TODAY' },
    { id: 2, type: 'progress', title: 'Anatomy: Neuro', time: '11:45', date: 'TODAY' },
    { id: 3, type: 'note', title: 'Cardiology Notes', time: '09:30', date: 'TODAY' },
    { id: 4, type: 'complete', title: 'Pathology Basics', time: '16:15', date: 'YESTERDAY' },
  ];

  return (
    <Card title="LOGS" className="h-full">
      <div className="flex flex-col h-full">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-3 border-b border-border-subtle last:border-0 group cursor-pointer hover:bg-surface-secondary -mx-6 px-6 transition-colors"
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              item.type === 'complete' ? 'bg-success' :
              item.type === 'progress' ? 'bg-accent-primary' : 'bg-accent-primary'
            }`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-text-primary truncate">{item.title}</span>
                <span className="text-[10px] font-mono text-text-tertiary">{item.time}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">{item.date}</span>
                 <span className="text-[10px] font-mono text-text-quaternary">ID: 8F-{item.id}2</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}