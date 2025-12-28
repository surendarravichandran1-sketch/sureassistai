import { Bot, Sparkles, Database, Settings, Zap } from "lucide-react";

interface WelcomeMessageProps {
  userName?: string;
}

const WelcomeMessage = ({ userName }: WelcomeMessageProps) => {
  const features = [
    { icon: Database, label: "SAP Cash Application" },
    { icon: Settings, label: "Oracle Fusion & Equant" },
    { icon: Zap, label: "Excel VBA Automation" },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-effect animate-float">
          <Bot className="w-10 h-10 text-primary-foreground" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
      </div>

      <h2 className="text-2xl font-bold text-center mb-2">
        <span className="gradient-text">
          {userName ? `Welcome, ${userName}!` : "Welcome to SureAssist"}
        </span>
      </h2>

      <p className="text-muted-foreground text-center max-w-lg mb-6 chat-font">
        👋 Hi{userName ? ` ${userName}` : ""}! I'm SureAssist AI, built by Surendar Ravichandran like ChatGPT and specialized in SAP and Oracle Cash Application. Ask me anything about cash application processes, issues, or best practices!
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {features.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm text-foreground"
          >
            <Icon className="w-4 h-4 text-primary" />
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {[
          "How do I clear open items in SAP?",
          "Cash application best practices",
          "Oracle Fusion AR setup guide",
          "VBA automation for reconciliation",
        ].map((suggestion) => (
          <button
            key={suggestion}
            className="text-left px-4 py-3 rounded-xl bg-card border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeMessage;
