import { Code } from "lucide-react";

const ChatFooter = () => {
  return (
    <footer className="py-3 px-4 text-center border-t border-border/20">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Code className="w-3 h-3" />
        <span>Developed by</span>
        <span className="text-primary font-medium">Surendar Ravichandran</span>
      </div>
    </footer>
  );
};

export default ChatFooter;
