import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isNew?: boolean;
}

const ChatMessage = ({ role, content, isNew = false }: ChatMessageProps) => {
  const isUser = role === "user";

  // Format content with proper paragraph spacing
  const formatContent = (text: string) => {
    return text.split('\n\n').map((paragraph, idx) => (
      <p key={idx} className="chat-paragraph">
        {paragraph.split('\n').map((line, lineIdx) => (
          <span key={lineIdx}>
            {line}
            {lineIdx < paragraph.split('\n').length - 1 && <br />}
          </span>
        ))}
      </p>
    ));
  };

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-3",
        isNew && "animate-slide-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 chat-font",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border/50 rounded-bl-md"
        )}
      >
        {formatContent(content)}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
