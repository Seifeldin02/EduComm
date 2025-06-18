import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { AnimationWrapper } from '@/components/AnimationWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { Assignment } from '@/types/course';

export default function StudentReportActivityPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:3000/api/assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // TODO: Filter assignments by date range
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
            <Button onClick={fetchAssignments} className="self-end">Refresh</Button>
          </div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Assignment Activity (Chart Coming Soon)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chart placeholder */}
              <div className="h-48 flex items-center justify-center text-gray-400">[Chart will be here]</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assignment Table (Filtered by Date)</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Table placeholder */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left">Title</th>
                      <th className="px-2 py-1 text-left">Due Date</th>
                      <th className="px-2 py-1 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(a => (
                      <tr key={a.id}>
                        <td className="px-2 py-1">{a.title}</td>
                        <td className="px-2 py-1">{new Date(a.dueDate).toLocaleDateString()}</td>
                        <td className="px-2 py-1">{a.userSubmission ? a.userSubmission.status : 'Pending'}</td>
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