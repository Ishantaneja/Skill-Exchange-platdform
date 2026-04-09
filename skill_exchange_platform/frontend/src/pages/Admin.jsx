import React, { useEffect, useState } from 'react';
import axios from '../api';
import { useAuth } from '../AuthContext';
import PageContainer from '../components/ui/PageContainer';

export default function Admin() {
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        if (err.response?.status === 401) setError('Not authenticated');
        else if (err.response?.status === 403) setError('Access Denied');
        else setError('Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [authLoading, user, token]);

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-10 text-gray-600">Loading admin dashboard...</div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.total_users ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.total_requests ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Pending Requests</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.pending_requests ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Completed Sessions</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.completed_sessions ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Active Sessions</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.active_sessions ?? 0}</p>
        </div>
      </div>
    </PageContainer>
  );
}