import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MentorContext {
  symbol?: string;
  currentPrice?: number;
  position?: {
    type: 'LONG' | 'SHORT';
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    leverage: number;
  };
  context?: string;
}

const AI_MENTOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`;

export function useAIMentor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, context?: MentorContext) => {
    setIsLoading(true);
    setError(null);

    const userMsg: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);

    let assistantContent = '';

    try {
      const response = await fetch(AI_MENTOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message,
          symbol: context?.symbol,
          currentPrice: context?.currentPrice,
          position: context?.position,
          context: context?.context,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        }
        if (response.status === 402) {
          throw new Error('크레딧이 부족합니다.');
        }
        throw new Error('AI 멘토 서비스 오류');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const updateAssistantMessage = (content: string) => {
        assistantContent = content;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: 'assistant', content }];
        });
      };

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
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistantMessage(assistantContent);
            }
          } catch {
            // Incomplete JSON, put back
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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistantMessage(assistantContent);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
