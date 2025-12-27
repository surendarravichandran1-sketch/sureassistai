import { useState, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isNew?: boolean;
}

interface UseChatOptions {
  onSendMessage?: (messages: Message[], userMessage: string) => Promise<string>;
}

export const useChat = (options?: UseChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOracleQuestion, setPendingOracleQuestion] = useState<string | null>(null);
  const [showOracleSelector, setShowOracleSelector] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Check if message is Oracle-related
  const isOracleRelated = (message: string): boolean => {
    const oracleKeywords = ["oracle", "equant", "fusion", "o2c oracle", "ar oracle"];
    const lowerMessage = message.toLowerCase();
    return oracleKeywords.some((keyword) => lowerMessage.includes(keyword));
  };

  const sendMessage = useCallback(
    async (content: string, oracleSystem?: string) => {
      // If Oracle-related and no system selected yet, show selector
      if (isOracleRelated(content) && !oracleSystem && !pendingOracleQuestion) {
        const userMessage: Message = {
          id: generateId(),
          role: "user",
          content,
          isNew: true,
        };
        setMessages((prev) => [...prev, userMessage]);
        setPendingOracleQuestion(content);
        setShowOracleSelector(true);
        return;
      }

      let finalContent = content;
      if (oracleSystem) {
        finalContent = `[Oracle System: ${oracleSystem === "equant" ? "Oracle Equant" : "Oracle Fusion"}] ${pendingOracleQuestion || content}`;
        setPendingOracleQuestion(null);
        setShowOracleSelector(false);
      }

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: oracleSystem ? `${pendingOracleQuestion}` : content,
        isNew: !oracleSystem, // Don't animate if it's a continuation
      };

      if (!oracleSystem) {
        setMessages((prev) => [...prev, userMessage]);
      }

      setIsLoading(true);

      try {
        // Get AI response
        const allMessages = [...messages, userMessage];
        const aiResponse = options?.onSendMessage
          ? await options.onSendMessage(allMessages, finalContent)
          : "I apologize, but I'm not connected to the AI service yet. Please ensure the backend is configured.";

        const assistantMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: aiResponse,
          isNew: true,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: "I apologize, but I encountered an error processing your request. Please try again.",
          isNew: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, options, pendingOracleQuestion]
  );

  const handleOracleSelect = useCallback(
    (system: string) => {
      if (pendingOracleQuestion) {
        sendMessage(pendingOracleQuestion, system);
      }
    },
    [pendingOracleQuestion, sendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingOracleQuestion(null);
    setShowOracleSelector(false);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    showOracleSelector,
    handleOracleSelect,
  };
};
