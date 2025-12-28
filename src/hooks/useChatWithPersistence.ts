import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isNew?: boolean;
}

export const useChatWithPersistence = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingOracleQuestion, setPendingOracleQuestion] = useState<string | null>(null);
  const [showOracleSelector, setShowOracleSelector] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Create a new chat session
  const createSession = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating session:", error);
      return null;
    }
    
    setSessionId(data.id);
    return data.id;
  };

  // Save message to database
  const saveMessage = async (currentSessionId: string, role: "user" | "assistant", content: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: currentSessionId,
        role,
        content,
      });
    
    if (error) {
      console.error("Error saving message:", error);
    }

    // Update session title based on first user message
    if (role === "user" && messages.length === 0) {
      const title = content.length > 50 ? content.substring(0, 50) + "..." : content;
      await supabase
        .from("chat_sessions")
        .update({ title })
        .eq("id", currentSessionId);
    }
  };

  // Check if message is Oracle-related
  const isOracleRelated = (message: string): boolean => {
    const oracleKeywords = ["oracle", "equant", "fusion", "o2c oracle", "ar oracle"];
    const lowerMessage = message.toLowerCase();
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
      // Add user's name context to the first message
      const messagesWithContext = [...chatMessages];
      if (profile?.display_name && messagesWithContext.length > 0) {
        const systemContext = `[User's name is ${profile.display_name}] `;
        messagesWithContext[0] = {
          ...messagesWithContext[0],
          content: systemContext + messagesWithContext[0].content,
        };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sureassist-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: messagesWithContext }),
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
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

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

      // Ensure we have a session
      let currentSessionId = sessionId;
      if (!currentSessionId && user) {
        currentSessionId = await createSession();
      }

      // Save user message to database
      if (currentSessionId) {
        await saveMessage(currentSessionId, "user", userMessage.content);
      }

      // Build chat history for API
      const allMessages = [...messages];
      if (!oracleSystem) {
        allMessages.push({ id: userMessage.id, role: "user", content: userMessage.content });
      }
      
      const chatHistory = allMessages.map(m => ({ role: m.role, content: m.content }));
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
        async () => {
          setIsLoading(false);
          // Save assistant message to database
          if (currentSessionId && assistantContent) {
            await saveMessage(currentSessionId, "assistant", assistantContent);
          }
        },
        (error) => {
          setIsLoading(false);
          const errorMessage = `I apologize, but I encountered an error: ${error}. Please try again.`;
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              content: errorMessage,
              isNew: true,
            },
          ]);
        }
      );
    },
    [messages, pendingOracleQuestion, sessionId, user, profile]
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
    setSessionId(null);
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
