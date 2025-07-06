import { AnimationWrapper } from "@/components/AnimationWrapper";
import DirectMessages from "@/components/chat/DirectMessages";
import Layout from "@/components/layout/Layout";

interface MessagesPageProps {
  /**
   * Optional title for the messages page
   * @default "Messages"
   */
  title?: string;
}

/**
 * Reusable Messages Page component for both students and lecturers
 * Uses the DirectMessages component which handles all chat functionality internally
 */
export default function MessagesPage({
  title = "Messages",
}: MessagesPageProps) {
  return (
    <Layout>
      <AnimationWrapper>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6">
            <DirectMessages />
          </div>
        </div>
      </AnimationWrapper>
    </Layout>
  );
}
