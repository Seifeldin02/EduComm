import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import GroupChat from "@/components/chat/GroupChat";
import { toast } from "sonner";

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
      if (!user || !groupId) {
        setLoading(false);
        navigate("/lecturer/groups");
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch(`http://localhost:3000/api/groups/${groupId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch group");
        }

        const data = await res.json();

        if (!data.success || !data.group) {
          throw new Error("Invalid group data received");
        }

        const isMember = data.group.members.some(
          (member: { uid: string }) => member.uid === user.uid
        );

        if (!isMember) {
          toast.error("You do not have access to this group");
          navigate("/lecturer/groups");
          return;
        }

        setGroup(data.group);
      } catch (error: any) {
        console.error("Error checking group access:", error);
        toast.error(error.message || "Failed to verify group access");
        navigate("/lecturer/groups");
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <Layout>
      <div className="h-[calc(100dvh-theme(spacing.header)-theme(spacing.footer)-1px)] overflow-hidden">
        <GroupChat groupId={group.id} groupName={group.name} />
      </div>
    </Layout>
  );
}
