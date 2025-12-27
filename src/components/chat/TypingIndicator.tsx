import { Bot } from "lucide-react";

const TypingIndicator = () => {
  return (
    <div className="flex gap-4 px-4 py-3 animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse-glow">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>

      <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-primary rounded-full animate-typing"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 bg-primary rounded-full animate-typing"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 bg-primary rounded-full animate-typing"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-sm text-muted-foreground ml-2">
            Thinking and preparing a detailed answer...
          </span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
