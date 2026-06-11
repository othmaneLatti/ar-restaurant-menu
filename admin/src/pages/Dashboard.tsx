import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui';
import { BarChart, Utensils, QrCode, Clock } from 'lucide-react';

export default function Dashboard() {
  const { admin } = useAuth();

  const { data: menuData, isLoading: loadingMenu } = useQuery({
    queryKey: ['menu', admin?.restaurant_id],
    queryFn: () => api.get(`/menu/${admin?.restaurant_id}`).then(res => res.data),
    enabled: !!admin?.restaurant_id,
  });

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics', admin?.restaurant_id],
    queryFn: () => api.get(`/analytics/${admin?.restaurant_id}`).then(res => res.data),
    enabled: !!admin?.restaurant_id,
  });

  const totalCategories = menuData?.categories?.length || 0;
  const totalItems = menuData?.items?.length || 0;
  
  // Calculate total scans from analytics events
  const totalScans = analyticsData?.events?.filter((e: any) => e.event_type === 'QR_SCAN').length || 0;
  
  // Calculate average session duration
  const sessions = analyticsData?.events?.filter((e: any) => e.event_type === 'SESSION_END' && e.duration_ms) || [];
  const avgSessionSec = sessions.length 
    ? Math.round(sessions.reduce((acc: number, e: any) => acc + e.duration_ms, 0) / sessions.length / 1000) 
    : 0;

  const stats = [
    { label: 'Total Categories', value: loadingMenu ? '...' : totalCategories, icon: Utensils, color: 'text-blue-400' },
    { label: 'Menu Items', value: loadingMenu ? '...' : totalItems, icon: LayoutDashboard, color: 'text-emerald-400' },
    { label: 'Total QR Scans', value: loadingAnalytics ? '...' : totalScans, icon: QrCode, color: 'text-primary' },
    { label: 'Avg Session (s)', value: loadingAnalytics ? '...' : avgSessionSec, icon: Clock, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-sora font-bold mb-2">Overview</h1>
        <p className="text-text-muted">Welcome back, here's what's happening today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="flex items-center gap-4 hover:shadow-panel transition-shadow duration-300">
              <div className="p-4 bg-secondary rounded-xl border border-border">
                <Icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-text-muted text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-sora font-bold mt-1">{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Temporary import for the layout dashboard icon since I forgot it above
import { LayoutDashboard } from 'lucide-react';
