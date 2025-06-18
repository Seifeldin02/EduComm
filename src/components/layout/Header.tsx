import { motion } from "framer-motion";
import { Bell, Search, MessageCircle } from "react-feather";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from 'react';
import { firestore } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

// Notification type for better type safety
interface NotificationItem {
  id: string;
  type: string;
  groupName?: string;
  courseName?: string;
  assignmentTitle?: string;
  topicTitle?: string;
  chatId?: string;
  groupId?: string;
  lastMessage?: string;
  count?: number;
  timestamp: number;
  read?: boolean;
  courseId?: string;
  topicId?: string;
}

const Header = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, `notifications/${user.uid}/items`),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationItem));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [user]);

  const markAsRead = async (notifId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(firestore, `notifications/${user.uid}/items/${notifId}`), { read: true });
    } catch {}
  };

  // Group notifications
  const messageNotifs = notifications.filter(n => (n.type === 'group_message' || n.type === 'direct_message'));
  const courseNotifs = notifications.filter(n => n.type === 'new_assignment' || n.type === 'new_topic');

  // Helper: get avatar and name
  const getNotifAvatar = (notif: NotificationItem) => {
    if (notif.type === 'group_message') {
      return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{notif.groupName?.[0] || notif.groupId?.[0] || 'G'}</div>;
    }
    if (notif.type === 'direct_message') {
      return <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600">DM</div>;
    }
    if (notif.type === 'new_assignment') {
      return <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">A</div>;
    }
    if (notif.type === 'new_topic') {
      return <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-600">T</div>;
    }
    return <div className="w-8 h-8 rounded-full bg-gray-200" />;
  };

  // Helper: handle click
  const handleNotifClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    if (notif.type === 'group_message' && notif.groupId) {
      navigate(`/student/group-chat/${notif.groupId}`);
    } else if (notif.type === 'direct_message' && notif.chatId) {
      navigate(`/student/chat/${notif.chatId}`);
    } else if (notif.type === 'new_assignment' && notif.courseId) {
      navigate(`/student/assignments?course=${notif.courseId}`);
    } else if (notif.type === 'new_topic' && notif.courseId && notif.topicId) {
      navigate(`/student/courses/${notif.courseId}/topics/${notif.topicId}`);
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white border-b border-gray-200 sticky top-0 z-40"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <img
              src="/EduCommLogo.png"
              alt="EduComm Logo"
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-xl font-bold text-gray-800 tracking-wide hidden md:block">
              EduComm
            </h1>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search courses, assignments, or resources..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative focus:outline-none">
                  <Bell className="w-6 h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 max-h-[32rem] overflow-y-auto p-0">
                <div className="font-semibold px-4 py-3 border-b text-lg">Notifications</div>
                {/* Messages Section */}
                <div className="px-4 pt-3 pb-1 text-xs text-gray-500 font-semibold uppercase tracking-wide">Messages</div>
                {messageNotifs.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-400 flex flex-col items-center">
                    <Bell className="w-10 h-10 mb-2 opacity-30" />
                    No new messages
                  </div>
                ) : (
                  messageNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-center gap-3 px-4 py-3 border-b hover:bg-blue-50 cursor-pointer transition ${!notif.read ? 'bg-blue-50' : 'bg-white'}`}
                      onClick={() => handleNotifClick(notif)}
                    >
                      {getNotifAvatar(notif)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {notif.type === 'group_message' ? notif.groupName || notif.groupId : 'Direct Message'}
                          </span>
                          {notif.count && notif.count > 1 && (
                            <Badge variant="default" className="ml-1">{notif.count}</Badge>
                          )}
                        </div>
                        {notif.lastMessage && (
                          <span className="text-sm text-gray-700 truncate max-w-xs block">{notif.lastMessage}</span>
                        )}
                        <span className="text-xs text-gray-400 mt-1 block">{new Date(notif.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
                {/* Course Updates Section */}
                <div className="px-4 pt-4 pb-1 text-xs text-gray-500 font-semibold uppercase tracking-wide">Course Updates</div>
                {courseNotifs.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-400 flex flex-col items-center">
                    <Bell className="w-10 h-10 mb-2 opacity-30" />
                    No course updates
                  </div>
                ) : (
                  courseNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-center gap-3 px-4 py-3 border-b hover:bg-yellow-50 cursor-pointer transition ${!notif.read ? 'bg-yellow-50' : 'bg-white'}`}
                      onClick={() => handleNotifClick(notif)}
                    >
                      {getNotifAvatar(notif)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {notif.type === 'new_assignment' ? `Assignment: ${notif.assignmentTitle}` : `Topic: ${notif.topicTitle}`}
                          </span>
                        </div>
                        {notif.courseName && (
                          <span className="text-xs text-gray-500">{notif.courseName}</span>
                        )}
                        <span className="text-xs text-gray-400 mt-1 block">{new Date(notif.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <img
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=random`}
                alt="Profile"
                className="h-8 w-8 rounded-full border-2 border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
