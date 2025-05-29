import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { AnimationWrapper } from "@/components/AnimationWrapper";
import { useAuthStore } from "@/store/useAuthStore";
import { UserAutocomplete } from "@/components/user/UserAutocomplete";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "react-feather";
import DirectMessages from "@/components/chat/DirectMessages";
import Layout from "@/components/layout/Layout";
import { toast } from "sonner";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showNewChat, setShowNewChat] = useState(false);

  const handleStartChat = async (selectedUser: any) => {
    try {
      const response = await fetch(`http://localhost:3000/api/chats/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({ userId: selectedUser.uid }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create chat");
      }

      const { chatId } = await response.json();
      navigate(`/student/chat/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start chat");
    }
  };

  return (
    <Layout>
      <AnimationWrapper>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
            <Button onClick={() => setShowNewChat(true)}>
              <MessageCircle className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6">
            {showNewChat ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">New Message</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewChat(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    <UserAutocomplete
                      onSelect={handleStartChat}
                      placeholder="Search for a user to message"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <DirectMessages />
            )}
          </div>
        </div>
      </AnimationWrapper>
    </Layout>
  );
} 