"use client";

import React from 'react';
import { Card } from '../ui/Card';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  title: string;
  category: string;
  progress: number;
  duration: string;
  image?: string;
}

export function CourseCard({ title, category, progress, duration, image }: CourseCardProps) {
  return (
    <Card interactive={true} className="overflow-hidden h-full flex flex-col group">
      {image ? (
        <div className="aspect-video w-full bg-surface-secondary relative overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-base to-transparent opacity-60" />
        </div>
      ) : (
        <div className="aspect-video w-full bg-surface-secondary flex items-center justify-center border-b border-border-subtle">
           <BookOpen className="text-text-quaternary" size={32} />
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono text-accent-primary border border-accent-primary/20 px-1.5 py-0.5 rounded uppercase tracking-widest">
            {category}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-text-tertiary">
            <Clock size={10} />
            {duration}
          </div>
        </div>

        <h3 className="text-sm font-bold text-text-primary mb-4 line-clamp-2 uppercase tracking-tight">
          {title}
        </h3>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-text-tertiary uppercase">Progress</span>
            <span className="text-text-primary font-bold">{progress}%</span>
          </div>
          
          <div className="h-1 w-full bg-surface-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-primary transition-all duration-500" 
              style={{ width: `${progress}%` }} 
            />
          </div>

          <div className="flex items-center justify-end text-accent-primary group-hover:translate-x-1 transition-transform">
             <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Card>
  );
}
