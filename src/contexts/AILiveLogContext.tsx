import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

export type AILiveLogLevel = 'info' | 'success' | 'warning' | 'error';

export interface AILiveLogEntry {
  id: string;
  timestamp: Date;
  level: AILiveLogLevel;
  message: string;
}

interface AILiveLogContextValue {
  logs: AILiveLogEntry[];
  addLog: (entry: { level?: AILiveLogLevel; message: string }) => void;
  clearLogs: () => void;
}

const AILiveLogContext = createContext<AILiveLogContextValue | undefined>(undefined);

export function AILiveLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<AILiveLogEntry[]>([]);

  const addLog = useCallback((entry: { level?: AILiveLogLevel; message: string }) => {
    const level: AILiveLogLevel = entry.level ?? 'info';
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date();

    setLogs(prev => {
      const next = [{ id, timestamp, level, message: entry.message }, ...prev];
      // 최근 100개까지만 유지
      return next.slice(0, 100);
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <AILiveLogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </AILiveLogContext.Provider>
  );
}

export function useAILiveLog() {
  const ctx = useContext(AILiveLogContext);
  if (!ctx) {
    throw new Error('useAILiveLog must be used within AILiveLogProvider');
  }
  return ctx;
}

