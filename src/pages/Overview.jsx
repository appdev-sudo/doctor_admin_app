import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Users, Calendar, Clock } from 'lucide-react';

const Overview = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSubscriptions: 0,
    pendingBookings: 0,
    totalNurses: 0,
    approvedNurses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/stats`);
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-card flex items-center justify-between">
      <div>
        <p className="text-muted" style={{ marginBottom: '8px' }}>{title}</p>
        <h3 className="text-3xl">{value}</h3>
      </div>
      <div style={{ background: `${color}22`, padding: '16px', borderRadius: '12px' }}>
        <Icon size={32} color={color} />
      </div>
    </div>
  );

  if (loading) return <div style={{ color: 'white' }}>Loading dashboard...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl">Dashboard Overview</h1>
        <p className="text-muted mt-2">Welcome back, doctor. Here is what's happening today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard title="Regular Bookings" value={stats.totalBookings} icon={Calendar} color="var(--primary)" />
        <StatCard title="Subscriptions" value={stats.totalSubscriptions} icon={Calendar} color="#8B5CF6" />
        <StatCard title="Pending Sessions" value={stats.pendingBookings} icon={Clock} color="#F59E0B" />
        <StatCard title="Total Nurses" value={stats.totalNurses} icon={Users} color="var(--secondary)" />
        <StatCard title="Approved Nurses" value={stats.approvedNurses} icon={Activity} color="#10B981" />
      </div>
      
      {/* Could add a chart or recent activity here in the future */}
      <div className="glass-card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">Activity Chart coming soon...</p>
      </div>
    </div>
  );
};

export default Overview;
