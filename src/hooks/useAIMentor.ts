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

/** 크레딧 부족 시 로컬 폴백 응답 생성 */
function generateLocalFallback(message: string, context?: MentorContext): string {
  const symbol = context?.symbol || 'BTC';
  const price = context?.currentPrice ? `$${context.currentPrice.toLocaleString()}` : '현재가';
  const pos = context?.position;

  if (pos) {
    const pnl = pos.type === 'LONG'
      ? ((context!.currentPrice! - pos.entryPrice) / pos.entryPrice * 100 * pos.leverage).toFixed(2)
      : ((pos.entryPrice - context!.currentPrice!) / pos.entryPrice * 100 * pos.leverage).toFixed(2);
    return `📊 **Leaf-Master 로컬 분석** (오프라인 모드)\n\n**${symbol}/USDT** ${price}\n\n현재 ${pos.type} 포지션 보유중 (${pos.leverage}x)\n- 진입가: $${pos.entryPrice.toLocaleString()}\n- 목표가: $${pos.targetPrice.toLocaleString()}\n- 손절가: $${pos.stopLoss.toLocaleString()}\n- 예상 수익률: ${pnl}%\n\n🎯 목표가까지 ${pos.type === 'LONG' ? ((pos.targetPrice - context!.currentPrice!) / context!.currentPrice! * 100).toFixed(2) : ((context!.currentPrice! - pos.targetPrice) / context!.currentPrice! * 100).toFixed(2)}% 남음\n\n⚠️ *현재 AI 크레딧이 소진되어 로컬 분석을 제공합니다. 실시간 AI 분석은 크레딧 충전 후 이용 가능합니다.*`;
  }

  return `📊 **Leaf-Master 로컬 분석** (오프라인 모드)\n\n**${symbol}/USDT** ${price}\n\n현재 포지션이 없습니다. 시장 상황을 면밀히 관찰 중입니다.\n\n💡 **일반 가이드라인:**\n- RSI 30 이하: 과매도 구간, 롱 진입 검토\n- RSI 70 이상: 과매수 구간, 숏 진입 검토\n- 레버리지는 5x 이하 권장\n- 투입 비중은 전체 자산의 5~10%\n\n⚠️ *현재 AI 크레딧이 소진되어 로컬 분석을 제공합니다.*`;
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
          // 크레딧 부족 시 로컬 폴백 응답 제공
          const fallbackResponse = generateLocalFallback(message, context);
          setMessages(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
          setIsLoading(false);
          return;
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
