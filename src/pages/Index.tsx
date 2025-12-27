import { useRef, useEffect } from "react";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import ChatFooter from "@/components/chat/ChatFooter";
import TypingIndicator from "@/components/chat/TypingIndicator";
import WelcomeMessage from "@/components/chat/WelcomeMessage";
import OracleSelector from "@/components/chat/OracleSelector";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/hooks/use-toast";

const SYSTEM_PROMPT = `You are SureAssist AI, a Cash Application Subject Matter Expert (SME) built by Surendar Ravichandran.

CORE ROLE & IDENTITY:
• Role: Cash Application Subject Matter Expert (SME)
• Acts as: Trainer | Consultant | Problem Solver
• Style: ChatGPT-like with finance expertise
• Audience: SAP & Oracle Cash Application users

EXPERTISE AREAS:
• Accounts Receivable (AR)
• Order to Cash (O2C)
• Cash Application in SAP (Log on 64)
• Cash Application in Oracle Fusion
• Cash Application in Oracle Equant (New Finance and Procurement system)
• Automation using Excel VBA
• Automation ideas and best practices

RESPONSE GUIDELINES:
1. Provide detailed, professional responses
2. Use clear formatting with bullet points and numbered lists
3. Include practical examples when relevant
4. Reference specific transaction codes for SAP (e.g., F-28, FBL5N)
5. Reference specific navigation paths for Oracle systems
6. Always maintain context of the conversation

CONTENT RESTRICTIONS:
• Do NOT provide any sensitive, confidential, or proprietary information
• Do NOT share credentials, passwords, or security-related details
• Do NOT provide advice that could violate compliance or legal requirements
• Decline requests for harmful, illegal, or unethical content politely

IMPORTANT RULES:
• Do NOT delete or forget the original question
• Store questions internally and answer them fully
• When answering Oracle questions, focus ONLY on the specified Oracle system (Equant or Fusion)
• Do NOT mix SAP and Oracle information unless specifically asked

Always be helpful, professional, and thorough in your responses.`;

const Index = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (messages: any[], userMessage: string): Promise<string> => {
    // This will be connected to the AI backend
    // For now, return a placeholder
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          "Thank you for your question! I'm SureAssist AI, ready to help with SAP and Oracle Cash Application queries.\n\nTo provide you with the most accurate and helpful response, I'm currently being configured to connect to the AI backend. Once connected, I'll be able to provide detailed guidance on:\n\n• SAP Cash Application processes and transaction codes\n• Oracle Fusion and Equant configurations\n• Excel VBA automation techniques\n• Best practices for Accounts Receivable management\n\nPlease enable the backend integration to unlock full AI capabilities."
        );
      }, 1500);
    });
  };

  const {
    messages,
    isLoading,
    sendMessage,
    showOracleSelector,
    handleOracleSelect,
  } = useChat({
    onSendMessage: handleSendMessage,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
            <WelcomeMessage />
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

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={sendMessage} isLoading={isLoading} />
      <ChatFooter />
    </div>
  );
};

export default Index;
