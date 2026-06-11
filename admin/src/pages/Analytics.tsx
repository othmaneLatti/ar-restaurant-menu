import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Eye, Clock, QrCode, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui';

const COLORS = ['#FF6B35', '#F7C59F', '#4CAF88', '#FF4D6D', '#a855f7', '#3b82f6'];

export default function Analytics() {
  const { admin } = useAuth();

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics', admin?.restaurant_id],
    queryFn: () => api.get(`/analytics/${admin?.restaurant_id}`).then(res => res.data),
    enabled: !!admin?.restaurant_id,
  });

  const { data: menuData } = useQuery({
    queryKey: ['menu', admin?.restaurant_id],
    queryFn: () => api.get(`/menu/${admin?.restaurant_id}`).then(res => res.data),
    enabled: !!admin?.restaurant_id,
  });

  // Calculate views by category (map IDs to names)
  const categoryData = useMemo(() => {
    if (!analyticsData?.category_views || !menuData?.categories) return [];
    return Object.entries(analyticsData.category_views)
      .map(([id, count]) => {
        const cat = menuData.categories.find((c: any) => c.id === id);
        return { name: cat ? cat.name : 'Unknown', value: count };
      })
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5); // Top 5
  }, [analyticsData, menuData]);

  // Calculate scans over time (group by day)
  const scansData = useMemo(() => {
    if (!analyticsData?.events) return [];
    
    const scans = analyticsData.events.filter((e: any) => e.event_type === 'QR_SCAN');
    const grouped = scans.reduce((acc: any, event: any) => {
      const date = new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, count]) => ({ date, scans: count }));
  }, [analyticsData]);

  const summary = analyticsData?.summary || { total_scans: 0, total_sessions: 0, avg_session_duration_ms: 0 };
  const avgSession = Math.round(summary.avg_session_duration_ms / 1000);

  if (loadingAnalytics) {
    return <div className="animate-pulse text-text-muted">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-sora font-bold mb-2">Analytics</h1>
        <p className="text-text-muted">Understand your customer's engagement with the AR Menu.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <QrCode size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total Scans</p>
            <p className="text-2xl font-sora font-bold">{summary.total_scans}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Eye size={24} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Total Sessions</p>
            <p className="text-2xl font-sora font-bold">{summary.total_sessions}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Clock size={24} className="text-purple-500" />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Avg. Session Time</p>
            <p className="text-2xl font-sora font-bold">{avgSession} sec</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col h-[400px]">
          <h2 className="text-xl font-sora font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Scans Over Time
          </h2>
          <div className="flex-1 w-full">
            {scansData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scansData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E2E45" vertical={false} />
                  <XAxis dataKey="date" stroke="#9090A0" tick={{ fill: '#9090A0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9090A0" tick={{ fill: '#9090A0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#2E2E45', borderRadius: '12px' }}
                    itemStyle={{ color: '#F5F5F0' }}
                  />
                  <Bar dataKey="scans" fill="#FF6B35" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted">No scan data available</div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col h-[400px]">
          <h2 className="text-xl font-sora font-bold mb-6 flex items-center gap-2">
            <Eye size={20} className="text-accent" />
            Top Categories
          </h2>
          <div className="flex-1 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#2E2E45', borderRadius: '12px' }}
                    itemStyle={{ color: '#F5F5F0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted">No category views recorded</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
