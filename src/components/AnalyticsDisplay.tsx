'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Layers,
  TrendingUp,
  Calendar,
  Loader2,
} from 'lucide-react';

interface AnalyticsData {
  totalContent: number;
  totalOutputs: number;
  contentByStatus: Record<string, number>;
  outputsByFormat: Array<{ format: string; count: number }>;
  contentByDay: Record<string, number>;
  streak: number;
}

export default function AnalyticsDisplay() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      const response = await res.json();
      setData(response);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  }

  const formatLabels: Record<string, string> = {
    twitter_thread: 'Twitter Threads',
    linkedin_post: 'LinkedIn Posts',
    newsletter: 'Newsletters',
    tiktok_clip: 'TikTok Clips',
    quote_graphic: 'Quote Graphics',
    seo_summary: 'SEO Summaries',
    instagram_caption: 'Instagram Captions',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-500">Failed to load analytics</p>
        </CardContent>
      </Card>
    );
  }

  const maxDailyCount = Math.max(...Object.values(data.contentByDay), 1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Content
                </p>
                <p className="text-2xl font-bold">{data.totalContent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Layers className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Outputs
                </p>
                <p className="text-2xl font-bold">{data.totalOutputs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Active Streak
                </p>
                <p className="text-2xl font-bold">{data.streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This Month
                </p>
                <p className="text-2xl font-bold">
                  {data.contentByStatus.completed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outputs by Format */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.outputsByFormat
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.format}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <span className="font-medium">{formatLabels[item.format] || item.format}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {item.count}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1">
            {Object.entries(data.contentByDay)
              .slice(-30)
              .map(([date, count]) => (
                <div
                  key={date}
                  className="aspect-square rounded flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: count === 0
                      ? 'rgba(148, 163, 184, 0.1)'
                      : `rgba(124, 58, 237, ${0.2 + (count / maxDailyCount) * 0.8})`,
                  }}
                  title={`${date}: ${count}`}
                >
                  {count}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
