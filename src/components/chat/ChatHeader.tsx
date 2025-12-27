import { Bot, Sparkles } from "lucide-react";
const ChatHeader = () => {
  return <header className="glass-card border-b border-border/30 px-6 py-4 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-effect">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <span className="gradient-text">SureAssist</span>
              <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
            </h1>
            <p className="text-xs text-muted-foreground">
              SAP & Oracle Cash Application Expert
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-xs text-primary font-medium">Developed by Surendar</span>
          </div>
        </div>
      </div>
    </header>;
};
export default ChatHeader;