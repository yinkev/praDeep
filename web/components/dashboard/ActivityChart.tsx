"use client";

import React from 'react';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';

export function ActivityChart() {
  const data = [35, 60, 45, 70, 50, 80, 65, 90, 55, 40, 75, 50, 85, 95];

  return (
    <Card title="FREQUENCY RESPONSE" className="h-full min-h-[240px]">
      <div className="flex items-end justify-between h-full w-full gap-[2px] pt-4">
        {data.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end h-full gap-1 group">
             <div className="relative w-full h-full flex items-end">
                <motion.div
                  className="w-full bg-text-primary min-w-[4px] rounded-t-[1px]"
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: 0.5, delay: i * 0.03 }}
                >
                  {/* Hover Highlight */}
                  <div className="w-full h-full bg-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
             </div>
          </div>
        ))}
      </div>
      {/* Grid lines overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 pt-12 flex flex-col justify-between opacity-10">
         <div className="w-full h-px bg-text-primary border-t border-dashed" />
         <div className="w-full h-px bg-text-primary border-t border-dashed" />
         <div className="w-full h-px bg-text-primary border-t border-dashed" />
         <div className="w-full h-px bg-text-primary border-t border-dashed" />
      </div>
    </Card>
  );
}