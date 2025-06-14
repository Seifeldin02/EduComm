import { motion } from "framer-motion";
import { MoreVertical, Trash2 } from "react-feather";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageProps } from "@/types/chat";

export function Message({ message, isOwnMessage, translatedText, isLecturer, onDelete, currentUserId }: MessageProps) {
  // Determine if user can delete this message
  // In group chats: lecturer (group creator) can delete any message, or message sender can delete their own
  // In direct messages: only message sender can delete their own message
  const canDelete = isLecturer || (currentUserId && message.senderId === currentUserId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-xs lg:max-w-md space-y-1 relative group`}>
        {!isOwnMessage && (
          <p className="text-xs font-medium text-gray-600 ml-2">
            {message.senderName}
          </p>
        )}
        <div
          className={`relative px-4 py-2 rounded-lg ${
            isOwnMessage
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-800"
          }`}
        >
          {canDelete && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 hover:bg-transparent ${
                      isOwnMessage ? "text-blue-100" : "text-gray-400"
                    } hover:${isOwnMessage ? "text-white" : "text-gray-600"}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onDelete(message.id)}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <p className={`text-sm whitespace-pre-wrap ${canDelete ? "pr-6" : ""}`}>{message.text}</p>
          {translatedText && translatedText !== message.text && (
            <div
              className={`mt-2 pt-2 border-t ${
                isOwnMessage ? "border-blue-400" : "border-gray-200"
              }`}
            >
              <p
                className={`text-sm italic ${
                  isOwnMessage ? "text-blue-100" : "text-gray-600"
                }`}
              >
                {translatedText}
              </p>
            </div>
          )}
          <p
            className={`text-xs mt-1 ${
              isOwnMessage ? "text-blue-200" : "text-gray-400"
            } text-right`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
} 