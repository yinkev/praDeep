"use client";

import React from 'react';
import { Card } from '../ui/Card';

export function StatWidget() {
  return (
    <Card className="p-4 flex flex-col justify-center h-[120px]">
       <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-mono text-gray-400 uppercase">Time_To_Mastery</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
       </div>
       <div className="flex items-baseline gap-1">
          <span className="text-4xl font-sans font-light tracking-tighter">144.2</span>
          <span className="text-xs font-mono text-gray-400">HRS</span>
       </div>
    </Card>
  );
}

export function RankWidget() {
  return (
    <Card className="p-4 flex flex-col justify-center h-[120px] border-[#FF0055] bg-pink-50/10">
       <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-mono text-gray-400 uppercase">Global_Rank</span>
          <div className="w-2 h-2 bg-[#FF0055]" />
       </div>
       <div className="flex items-baseline gap-1">
          <span className="text-4xl font-mono font-bold tracking-tighter text-[#FF0055]">#0042</span>
       </div>
    </Card>
  );
}