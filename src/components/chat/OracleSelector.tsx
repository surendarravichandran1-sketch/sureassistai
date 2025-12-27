import { useState } from "react";
import { Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OracleSelectorProps {
  onSelect: (system: string) => void;
}

const OracleSelector = ({ onSelect }: OracleSelectorProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const systems = [
    {
      id: "equant",
      name: "Oracle Equant",
      description: "New Finance and Procurement System",
    },
    {
      id: "fusion",
      name: "Oracle Fusion",
      description: "Cloud ERP Platform",
    },
  ];

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="flex gap-4 px-4 py-3 animate-slide-up">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
        <Database className="w-4 h-4 text-primary-foreground" />
      </div>

      <div className="flex-1 bg-card border border-border/50 rounded-2xl rounded-bl-md p-4">
        <p className="text-sm text-foreground mb-4 chat-font">
          Is this for Oracle – Equant or Oracle Fusion?
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {systems.map((system) => (
            <button
              key={system.id}
              onClick={() => setSelected(system.id)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all duration-200",
                selected === system.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 hover:border-primary/30 hover:bg-secondary/30"
              )}
            >
              <p className="font-medium text-sm text-foreground">{system.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{system.description}</p>
            </button>
          ))}
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OracleSelector;
