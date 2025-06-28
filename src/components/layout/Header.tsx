import { motion } from "framer-motion";
import { Bell, Search, User, LogOut, Settings } from "react-feather";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from 'react';
import { firestore } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/auth';

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
  [key: string]: any; // Add index signature for dynamic key access
}

const Header = () => {
  const { user, role } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  // Group notifications by groupId (group_message) and chatId (direct_message)
  function groupByKey(notifs: NotificationItem[], key: string) {
    const map = new Map<string, NotificationItem & { count: number }>();
    for (const notif of notifs) {
      const groupKey = notif[key];
      if (!groupKey) continue;
      if (!map.has(groupKey)) {
        map.set(groupKey, { ...notif, count: notif.count || 1 });
      } else {
        // Update count and keep the latest notification
        const existing = map.get(groupKey)!;
        if ((notif.timestamp || 0) > (existing.timestamp || 0)) {
          map.set(groupKey, { ...notif, count: (notif.count || 1) + (existing.count || 1) });
        } else {
          map.set(groupKey, { ...existing, count: (existing.count || 1) + (notif.count || 1) });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Grouped notifications for messages
  const groupMessageNotifs = groupByKey(
    notifications.filter(n => n.type === 'group_message'),
    'groupId'
  );
  const directMessageNotifs = groupByKey(
    notifications.filter(n => n.type === 'direct_message'),
    'chatId'
  );
  const messageNotifs = [...groupMessageNotifs, ...directMessageNotifs].sort((a, b) => b.timestamp - a.timestamp);
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
      const base = role === 'Lecturer' ? '/lecturer' : '/student';
      navigate(`${base}/group-chat/${notif.groupId}`);
    } else if (notif.type === 'direct_message' && notif.chatId) {
      const base = role === 'Lecturer' ? '/lecturer' : '/student';
      navigate(`${base}/chat/${notif.chatId}`);
    } else if (notif.type === 'new_assignment' && notif.courseId) {
      navigate(`/student/assignments?course=${notif.courseId}`);
    } else if (notif.type === 'new_topic' && notif.courseId && notif.topicId) {
      navigate(`/student/courses/${notif.courseId}/topics/${notif.topicId}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
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
            <Link to={role === 'Lecturer' ? '/lecturer/dashboard' : '/student/dashboard'} className="flex-shrink-0 flex items-center">
              <img
                src="/EduCommLogo.png"
                alt="EduComm Logo"
                className="h-8 w-auto"
              />
              <span className="ml-2 text-lg font-semibold text-blue-600">EduComm</span>
            </Link>
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
                          {(!notif.read && notif.count && notif.count > 1) && (
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
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={toggleDropdown}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {user?.displayName?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                    </div>
                  </button>
                </div>

                {isDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={closeDropdown}
                      aria-hidden="true"
                    ></div>
                    
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      <div className="py-1 border-b border-gray-100">
                        <div className="block px-4 py-2 text-sm text-gray-900">
                          <div className="font-medium">{user?.displayName}</div>
                          <div className="text-gray-500 truncate">{user?.email}</div>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={closeDropdown}
                        >
                          <Settings className="mr-2 h-4 w-4" /> Profile Settings
                        </Link>
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
