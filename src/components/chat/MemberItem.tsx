import { UserMinus } from "react-feather";
import { Button } from "@/components/ui/button";
import { MemberItemProps } from "@/types/chat";

export function MemberItem({ member, isLecturer, isCreator, onRemove }: MemberItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          {member.displayName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">{member.displayName}</p>
          <p className="text-xs text-gray-500">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {member.role === "Lecturer" && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Lecturer
          </span>
        )}
        {isLecturer && !isCreator && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-red-500"
            onClick={() => onRemove(member)}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 