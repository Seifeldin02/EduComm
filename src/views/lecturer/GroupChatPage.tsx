import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Layout from '@/components/layout/Layout';
import GroupChat from '@/components/chat/GroupChat';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  members: Array<{
    uid: string;
    email: string;
    displayName: string;
  }>;
}

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !groupId) return;

      try {
        const token = await user.getIdToken();
        const res = await fetch(`http://localhost:3000/api/groups/${groupId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch group');
        }

        const data = await res.json();
        const isMember = data.group.members.some((member: { uid: string }) => member.uid === user.uid);

        if (!isMember) {
          toast.error('You do not have access to this group');
          navigate('/groups');
          return;
        }

        setGroup(data.group);
      } catch (error) {
        console.error('Error checking group access:', error);
        toast.error('Failed to verify group access');
        navigate('/groups');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [groupId, user, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      </Layout>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)]">
        <GroupChat groupId={group.id} groupName={group.name} />
      </div>
    </Layout>
  );
} 