import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { AnimationWrapper } from '@/components/AnimationWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

export default function LecturerReportActivityPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:3000/api/lecturer-dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
      } else {
        setStats({});
      }
    } catch (error) {
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // TODO: Filter stats by date range
  // TODO: Add chart and table

  return (
    <AnimationWrapper>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Report Activity</h1>
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
            </div>
            <Button onClick={fetchStats} className="self-end">Refresh</Button>
          </div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Activity Overview (Chart Coming Soon)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chart placeholder */}
              <div className="h-48 flex items-center justify-center text-gray-400">[Chart will be here]</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity Table (Filtered by Date)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Table placeholder */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left">Metric</th>
                      <th className="px-2 py-1 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-2 py-1">{key}</td>
                        <td className="px-2 py-1">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AnimationWrapper>
  );
} 