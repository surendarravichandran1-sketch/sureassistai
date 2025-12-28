import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import ChatFooter from "@/components/chat/ChatFooter";
import TypingIndicator from "@/components/chat/TypingIndicator";
import WelcomeMessage from "@/components/chat/WelcomeMessage";
import OracleSelector from "@/components/chat/OracleSelector";
import { useChatWithPersistence } from "@/hooks/useChatWithPersistence";
import { Loader2 } from "lucide-react";

const Index = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();

  const {
    messages,
    isLoading,
    sendMessage,
    showOracleSelector,
    handleOracleSelect,
  } = useChatWithPersistence();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <ChatHeader />

      <main className="flex-1 overflow-y-auto scrollbar-thin relative">
        <div className="max-w-4xl mx-auto py-4">
          {messages.length === 0 ? (
            <WelcomeMessage userName={profile?.display_name} />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isNew={message.isNew}
                />
              ))}
            </>
          )}

          {showOracleSelector && (
            <OracleSelector onSelect={handleOracleSelect} />
          )}

          {isLoading && !messages.find(m => m.role === "assistant" && m.isNew) && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={sendMessage} isLoading={isLoading} />
      <ChatFooter />
    </div>
  );
};

export default Index;
