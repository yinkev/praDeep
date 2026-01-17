"use client";

import React from 'react';
import { Card } from '../ui/Card';
import { History } from 'lucide-react';
import { motion } from 'framer-motion';

export function CognitiveLoadHist() {
  const data = [40, 65, 45, 90, 55, 75, 50];

  return (
    <Card
      title="COGNITIVE_LOAD_HIST"
      className="h-full"
    >
      <div className="flex flex-col h-full gap-4">
        <div className="flex-1 flex items-end justify-between gap-1 h-[120px] pt-4">
          {data.map((value, i) => (
            <div key={i} className="flex-1 group relative flex flex-col items-center gap-2">
              <motion.div
                className="w-full bg-accent-primary rounded-t-[1px]"
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
              <span className="text-[10px] font-mono text-text-quaternary">
                T-0{i}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-accent-primary" />
             <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">Current Strain</span>
           </div>
           <span className="text-[10px] font-mono text-text-primary font-bold">84.2%</span>
        </div>
      </div>
    </Card>
  );
}
