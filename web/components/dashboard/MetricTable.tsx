"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricRow {
  tag: string;
  load: number;
  retention: string;
  ttm: string;
  trend?: 'up' | 'down' | 'stable';
}

export function MetricTable() {
  const rows: MetricRow[] = [
    { tag: 'L_REGRESSION', load: 0.85, retention: '92.4%', ttm: '1.2h', trend: 'up' },
    { tag: 'GRAD_DESCENT', load: 0.42, retention: '88.1%', ttm: '2.8h', trend: 'stable' },
    { tag: 'TENSOR_CALC', load: 0.98, retention: '76.0%', ttm: '14.5h', trend: 'down' },
  ];

  const getLoadColor = (load: number) => {
    if (load > 0.8) return 'bg-red-500';
    if (load > 0.6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRetentionColor = (retention: string) => {
    const value = parseFloat(retention);
    if (value >= 90) return 'text-green-600';
    if (value >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="shadow-sm border-0 bg-white dark:bg-gray-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Cognitive Metrics
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          Sort: Mastery Rank
        </Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-gray-700">
              <TableHead className="text-xs font-mono font-bold text-gray-500 uppercase">
                Algorithm
              </TableHead>
              <TableHead className="text-xs font-mono font-bold text-gray-500 uppercase">
                Cognitive Load
              </TableHead>
              <TableHead className="text-xs font-mono font-bold text-gray-500 uppercase">
                Retention
              </TableHead>
              <TableHead className="text-xs font-mono font-bold text-gray-500 uppercase">
                Time to Mastery
              </TableHead>
              <TableHead className="text-xs font-mono font-bold text-gray-500 uppercase">
                Trend
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <TableCell className="font-mono font-bold text-gray-900 dark:text-white">
                  {row.tag}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <Progress
                        value={row.load * 100}
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300 min-w-[3ch]">
                      {row.load.toFixed(2)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-mono font-bold ${getRetentionColor(row.retention)}`}>
                    {row.retention}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-gray-600 dark:text-gray-300">
                  {row.ttm}
                </TableCell>
                <TableCell>
                  {getTrendIcon(row.trend)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}