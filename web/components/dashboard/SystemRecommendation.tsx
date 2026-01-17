"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Lightbulb, TrendingUp, Zap, CheckCircle } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  category: 'performance' | 'efficiency' | 'learning';
}

export function SystemRecommendation() {
  const recommendations: Recommendation[] = [
    {
      id: 'async-threading',
      title: 'Enable Asynchronous Threading',
      description: 'Switch to asynchronous processing to reduce cognitive fatigue during peak load periods.',
      impact: 'high',
      confidence: 92,
      category: 'performance'
    },
    {
      id: 'memory-optimization',
      title: 'Memory Optimization',
      description: 'Implement memory pooling to improve retention rates for complex algorithms.',
      impact: 'medium',
      confidence: 78,
      category: 'efficiency'
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'efficiency': return <TrendingUp className="h-4 w-4" />;
      case 'learning': return <Lightbulb className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const currentRecommendation = recommendations[0];

  return (
    <Card className="shadow-sm border-0 bg-white dark:bg-gray-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          System Insights
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          AI Generated
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {getCategoryIcon(currentRecommendation.category)}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {currentRecommendation.title}
                </h4>
                <Badge className={`text-xs ${getImpactColor(currentRecommendation.impact)}`}>
                  {currentRecommendation.impact} impact
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentRecommendation.description}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Confidence</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {currentRecommendation.confidence}%
              </span>
            </div>
            <Progress value={currentRecommendation.confidence} className="h-2" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
            Apply Recommendation
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            View Details
          </Button>
        </div>

        <div className="flex justify-center gap-1 pt-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}