import { Group } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { GroupAvatar } from "@/components/ui/GroupAvatar";
import { Globe, ChevronRight, Info } from "react-feather";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSLATION_LANGUAGES } from "@/utils/translation";

interface ChatHeaderProps {
  groupInfo: Group | null;
  groupName: string;
  selectedLanguage: string;
  onLanguageChange: (value: string) => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

export function ChatHeader({
  groupInfo,
  groupName,
  selectedLanguage,
  onLanguageChange,
  showSidebar,
  onToggleSidebar,
}: ChatHeaderProps) {
  return (
    <div className="h-16 min-h-[64px] border-b border-gray-200 bg-white flex items-center px-4 justify-between">
      <div className="flex items-center space-x-3">
        <GroupAvatar
          name={groupInfo?.name || groupName}
          imageUrl={groupInfo?.imageUrl}
          size="sm"
        />
        <h2 className="text-lg font-semibold text-gray-800">
          {groupInfo?.name || groupName}
        </h2>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-gray-50 rounded-md px-2 py-1">
          <Globe className="w-4 h-4 text-gray-500" />
          <Select
            value={selectedLanguage}
            onValueChange={onLanguageChange}
          >
            <SelectTrigger className="w-[140px] border-none bg-transparent">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {TRANSLATION_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-700"
        >
          {showSidebar ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <Info className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
} 