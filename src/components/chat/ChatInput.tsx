import { useState, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-card border-t border-border/30 p-4 sticky bottom-0">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your Cash Application question..."
              className={cn(
                "min-h-[52px] max-h-[200px] resize-none pr-4",
                "bg-input border-border/50 focus:border-primary/50",
                "rounded-xl text-foreground placeholder:text-muted-foreground",
                "transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              )}
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "h-[52px] w-[52px] rounded-xl",
              "bg-gradient-to-r from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              input.trim() && !isLoading && "glow-effect"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
