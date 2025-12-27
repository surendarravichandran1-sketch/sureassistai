import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isNew?: boolean;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOracleQuestion, setPendingOracleQuestion] = useState<string | null>(null);
  const [showOracleSelector, setShowOracleSelector] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Check if message is Oracle-related
  const isOracleRelated = (message: string): boolean => {
    const oracleKeywords = ["oracle", "equant", "fusion", "o2c oracle", "ar oracle"];
    const lowerMessage = message.toLowerCase();
    // Check if it mentions oracle but NOT already specifying which system
    const hasOracleKeyword = oracleKeywords.some((keyword) => lowerMessage.includes(keyword));
    const alreadySpecified = lowerMessage.includes("oracle equant") || 
                            lowerMessage.includes("oracle fusion") ||
                            lowerMessage.includes("equant system") ||
                            lowerMessage.includes("fusion system");
    return hasOracleKeyword && !alreadySpecified;
  };

  const streamChat = async (
    chatMessages: { role: string; content: string }[],
    onDelta: (text: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sureassist-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: chatMessages }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              onDelta(content);
            }
          } catch {
            // Incomplete JSON, put it back
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch { /* ignore */ }
        }
      }

      onDone();
    } catch (error) {
      console.error('Stream chat error:', error);
      onError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
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
        const systemName = oracleSystem === "equant" ? "Oracle Equant (New Finance and Procurement System)" : "Oracle Fusion";
        finalContent = `[User selected ${systemName}] ${pendingOracleQuestion || content}`;
        setPendingOracleQuestion(null);
        setShowOracleSelector(false);
      }

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: oracleSystem ? `${pendingOracleQuestion}` : content,
        isNew: !oracleSystem,
      };

      if (!oracleSystem) {
        setMessages((prev) => [...prev, userMessage]);
      }

      setIsLoading(true);

      // Build chat history for API
      const allMessages = [...messages];
      if (!oracleSystem) {
        allMessages.push({ id: userMessage.id, role: "user", content: userMessage.content });
      }
      
      const chatHistory = allMessages.map(m => ({ role: m.role, content: m.content }));
      // Add the final content with oracle system context if applicable
      if (oracleSystem) {
        chatHistory.push({ role: "user", content: finalContent });
      }

      let assistantContent = "";
      const assistantId = generateId();

      await streamChat(
        chatHistory,
        (delta) => {
          assistantContent += delta;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === assistantId) {
              return prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              );
            }
            return [...prev, { id: assistantId, role: "assistant", content: assistantContent, isNew: true }];
          });
        },
        () => {
          setIsLoading(false);
        },
        (error) => {
          setIsLoading(false);
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              content: `I apologize, but I encountered an error: ${error}. Please try again.`,
              isNew: true,
            },
          ]);
        }
      );
    },
    [messages, pendingOracleQuestion]
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
