import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Users,
  MessageCircle,
  Settings,
  HelpCircle,
  ChevronLeft,
  FileText,
  BarChart2,
} from "react-feather";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { logout } from "@/firebase/auth";

const handleLogout = async () => {
  await logout();
  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setRole(null);
};

interface NavItemProps {
  to: string;
  icon: any;
  label: string;
  isActive: boolean;
  expanded: boolean;
}

const NavItem = ({
  to,
  icon: Icon,
  label,
  isActive,
  expanded,
}: NavItemProps) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
      isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    <Icon size={20} />
    <AnimatePresence>
      {expanded && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </Link>
);

const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const { role } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;
  const basePath = role === "Lecturer" ? "/lecturer" : "/student";

  const navigationItems = [
    { to: `${basePath}/dashboard`, icon: BarChart2, label: "Dashboard" },
    { to: `${basePath}/courses`, icon: BookOpen, label: "Courses" },
    { to: `${basePath}/groups`, icon: Users, label: "Study Groups" },
    { to: `${basePath}/messages`, icon: MessageCircle, label: "Messages" },
    { to: `${basePath}/assignments`, icon: FileText, label: "Assignments" },
    {
      to: `${basePath}/report-activity`,
      icon: BarChart2,
      label: "Report Activity",
    },
  ];

  return (
    <motion.div
      animate={{ width: expanded ? 240 : 72 }}
      className={`relative h-screen bg-white border-r border-gray-200 flex flex-col py-6 transition-all duration-300 ease-in-out`}
    >
      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <motion.div
          animate={{ rotate: expanded ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft size={16} />
        </motion.div>
      </button>

      {/* Navigation Section */}
      <div className="flex-1 px-3 space-y-1">
        {navigationItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.to)}
            expanded={expanded}
          />
        ))}
      </div>

      {/* Bottom Section */}
      <div className="px-3 space-y-1">
        <NavItem
          to={`${basePath}/settings`}
          icon={Settings}
          label="Settings"
          isActive={isActive(`${basePath}/settings`)}
          expanded={expanded}
        />
        <NavItem
          to={`${basePath}/help`}
          icon={HelpCircle}
          label="Help Center"
          isActive={isActive(`${basePath}/help`)}
          expanded={expanded}
        />
        <div className="pt-4">
          <Button
            onClick={handleLogout}
            className={`w-full bg-red-50 hover:bg-red-100 text-red-600 border-none transition-colors ${
              expanded ? "justify-start px-3" : "px-0"
            }`}
          >
            {expanded ? "Logout" : "×"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
